const express = require('express');
const mysql = require('mysql2/promise'); // Usamos a versão com Promessas
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
app.use(express.json()); // Para o Node entender JSON
app.use(cors()); // Libera acesso para o Front-end
app.use(express.static('.'));

// CONFIGURAÇÃO
const PORT = 3000;
const SECRET_KEY = 'minha_senha_super_secreta_da_faculdade';

// CONEXÃO COM O BANCO DO XAMPP
const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'trabalho_n3'
};

// --- ROTA DE LOGIN (Gera o Token) ---
app.post('/login', async (req, res) => {
    const { login, senha } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        // Busca usuário
        const [rows] = await connection.execute(
            'SELECT * FROM Usuario WHERE login = ? AND senha = ?', 
            [login, senha]
        );
        await connection.end();

        if (rows.length > 0) {
            const usuario = rows[0];
            // Gera o Token JWT
            const token = jwt.sign(
                { id: usuario.id_usuario, login: usuario.login },
                SECRET_KEY,
                { expiresIn: '1h' }
            );
            return res.json({ token });
        } else {
            return res.status(401).json({ erro: 'Login ou senha inválidos' });
        }
    } catch (error) {
        return res.status(500).json({ erro: error.message });
    }
});

// --- MIDDLEWARE DE SEGURANÇA (Verifica o Token) ---
function verificarToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Pega o token depois do "Bearer"

    if (!token) return res.status(401).json({ erro: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ erro: 'Token inválido ou expirado.' });
        req.user = user;
        next(); // Pode passar!
    });
}

// --- ROTA DE LISTAR PRODUTOS (Pública - Requisito da Procedure) ---
app.get('/produtos', async (req, res) => {
    const { categoria } = req.query;

    try {
        const connection = await mysql.createConnection(dbConfig);
        let sql = 'SELECT * FROM Produto';
        let params = [];

        // Se tiver filtro, usa a PROCEDURE do banco
        if (categoria) {
            sql = 'CALL sp_buscar_produtos_categoria(?)';
            params = [categoria];
        }

        const [rows] = await connection.execute(sql, params);
        await connection.end();
        
        // Se usou procedure, o resultado vem aninhado, senão vem direto
        const resultado = categoria ? rows[0] : rows;
        res.json(resultado);

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA DE CADASTRAR PRODUTO (Privada - Protegida por Token) ---
app.post('/produtos', verificarToken, async (req, res) => {
    const { nome, qtde, id_categoria } = req.body;

    if (!nome || !qtde || !id_categoria) {
        return res.status(400).json({ erro: 'Dados incompletos' });
    }

    try {
        const connection = await mysql.createConnection(dbConfig);
        // O Trigger do banco vai rodar automaticamente aqui no INSERT
        await connection.execute(
            'INSERT INTO Produto (nome_produto, qtde_produto, id_categoria) VALUES (?, ?, ?)',
            [nome, qtde, id_categoria]
        );
        await connection.end();

        res.json({ mensagem: 'Produto cadastrado via Node.js! (Trigger acionado)' });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA DE ATUALIZAR PRODUTO (PUT) ---
app.put('/produtos/:id', verificarToken, async (req, res) => {
    const { id } = req.params;
    const { nome, qtde, id_categoria } = req.body;

    try {
        const connection = await mysql.createConnection(dbConfig);
        await connection.execute(
            'UPDATE Produto SET nome_produto = ?, qtde_produto = ?, id_categoria = ? WHERE cod_produto = ?',
            [nome, qtde, id_categoria, id]
        );
        await connection.end();
        res.json({ mensagem: 'Produto atualizado com sucesso!' });
    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA DE EXCLUIR PRODUTO (DELETE COM CASCATA) ---
app.delete('/produtos/:id', verificarToken, async (req, res) => {
    const { id } = req.params;

    try {
        const connection = await mysql.createConnection(dbConfig);
        
        // PASSO 1: Primeiro, apaga os PEDIDOS desse produto (limpa os filhos)
        await connection.execute('DELETE FROM Pedido WHERE cod_produto = ?', [id]);

        // PASSO 2: Agora que não tem mais dependentes, apaga o PRODUTO (apaga o pai)
        await connection.execute('DELETE FROM Produto WHERE cod_produto = ?', [id]);
        
        await connection.end();
        res.json({ mensagem: 'Produto e seus pedidos foram excluídos com sucesso!' });

    } catch (error) {
        res.status(500).json({ erro: error.message });
    }
});

// --- ROTA EXTRA: RELATÓRIOS (Para mostrar as Views no Sistema) ---
app.get('/relatorios/pedidos', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Chama a View 1
        const [rows] = await connection.execute('SELECT * FROM v_relatorio_pedidos');
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

app.get('/relatorios/estoque', async (req, res) => {
    try {
        const connection = await mysql.createConnection(dbConfig);
        // Chama a View 2
        const [rows] = await connection.execute('SELECT * FROM v_estoque_critico');
        await connection.end();
        res.json(rows);
    } catch (error) { res.status(500).json({ erro: error.message }); }
});

// INICIA O SERVIDOR
app.listen(PORT, () => {
    console.log(`Servidor Node rodando em http://localhost:${PORT}`);
});