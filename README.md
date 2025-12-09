# Sistema de Gestão de Estoque - Trabalho N3

Este projeto é uma aplicação Full Stack desenvolvida pelos alunos **MArcos Vinicius** e **Yan Carlos** para as disciplinas de **Banco de Dados** e **Server-Side**. 
O sistema realiza o controle de estoque de produtos com automação de pedidos de reposição via Banco de Dados.

## Tecnologias Utilizadas

* **Front-end:** HTML5, CSS3, JavaScript (Fetch API).
* **Back-end:** Node.js (Express).
* **Banco de Dados:** MariaDB/MySQL (via XAMPP).
* **Segurança:** JWT (JSON Web Token) para autenticação.
* **Recursos de BD:** Triggers, Stored Procedures e Views.


## Passo a Passo para Rodar o Projeto

para configurar e executar o sistema

### 1. Pré-requisitos
Certifique-se de ter instalado:
* **XAMPP** (com MySQL/MariaDB).
* **Node.js** (versão LTS).
* **VS Code**.

### 2. Configurar o Banco de Dados
1.  Abra o **XAMPP Control Panel** e inicie o módulo **MySQL** (botão Start).
2.  Clique no botão **Shell** do XAMPP.
3.  Digite `mysql -u root` e dê Enter.
4.  Copie e cole o script SQL completo do trabalho (que cria o banco `trabalho_n3`, tabelas, triggers e procedures). (Abaixo no fim do arquivo)
5.  Verifique se apareceu `Query OK`.

### 3. Instalar Dependências do Back-end
1.  Abra a pasta deste projeto no **VS Code**.
2.  Abra o terminal integrado (`Ctrl + '`).
3.  Execute o comando para baixar as bibliotecas necessárias:
    ```bash
    npm install
    ```

### 4. Iniciar o Servidor
No terminal do VS Code, execute:
```bash
node server.js

----------------------------
Estrutura de Arquivos

server.js: API Node.js (Rotas, Conexão com Banco, Lógica JWT).

index.html: Front-end (Interface, Formulários, Scripts de Fetch).

package.json: Lista de dependências do Node.

README.md: Este arquivo de instruções.


### Script SQL do Banco de Dados
Copie o código abaixo e execute no seu Shell do MariaDB/MySQL:

<details>
<summary><strong>Clique aqui para ver o código SQL completo</strong></summary>

```sql
-- 1. Limpeza e Criação do Banco
DROP DATABASE IF EXISTS trabalho_n3;
CREATE DATABASE trabalho_n3;
USE trabalho_n3;

-- 2. Tabelas
CREATE TABLE Categoria (
    id_categoria INT PRIMARY KEY AUTO_INCREMENT,
    nome_categoria VARCHAR(100) NOT NULL
);

CREATE TABLE Produto (
    cod_produto INT PRIMARY KEY AUTO_INCREMENT,
    nome_produto VARCHAR(100) NOT NULL,
    qtde_produto INT NOT NULL,
    id_categoria INT,
    FOREIGN KEY (id_categoria) REFERENCES Categoria(id_categoria)
);

CREATE TABLE Pedido (
    num_pedido INT PRIMARY KEY AUTO_INCREMENT,
    cod_produto INT,
    qtde_pedido INT,
    data_pedido DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (cod_produto) REFERENCES Produto(cod_produto)
);

CREATE TABLE Usuario (
    id_usuario INT PRIMARY KEY AUTO_INCREMENT,
    login VARCHAR(50) UNIQUE NOT NULL,
    senha VARCHAR(255) NOT NULL
);

-- 3. Trigger (Automação de Pedidos)
DELIMITER //
CREATE TRIGGER trg_gerar_pedido_automatico
AFTER INSERT ON Produto
FOR EACH ROW
BEGIN
    IF NEW.qtde_produto <= 3 THEN
        INSERT INTO Pedido (cod_produto, qtde_pedido) VALUES (NEW.cod_produto, 4);
    ELSEIF NEW.qtde_produto > 3 AND NEW.qtde_produto < 7 THEN
        INSERT INTO Pedido (cod_produto, qtde_pedido) VALUES (NEW.cod_produto, 3);
    END IF;
END //
DELIMITER ;

-- 4. Stored Procedure (Busca por Categoria)
DELIMITER //
CREATE PROCEDURE sp_buscar_produtos_categoria(IN p_termo VARCHAR(50))
BEGIN
    SELECT p.nome_produto, p.qtde_produto, c.nome_categoria
    FROM Produto p
    INNER JOIN Categoria c ON p.id_categoria = c.id_categoria
    WHERE c.nome_categoria LIKE CONCAT('%', p_termo, '%');
END //
DELIMITER ;

-- 5. Views (Relatórios)

-- Alterado de 'CREATE OR REPLACE' para apenas 'CREATE' conforme solicitação
CREATE VIEW v_relatorio_pedidos AS
SELECT ped.num_pedido, prod.nome_produto, cat.nome_categoria, ped.qtde_pedido, ped.data_pedido
FROM Pedido ped
INNER JOIN Produto prod ON ped.cod_produto = prod.cod_produto
INNER JOIN Categoria cat ON prod.id_categoria = cat.id_categoria;

CREATE VIEW v_estoque_critico AS
SELECT p.nome_produto, p.qtde_produto, c.nome_categoria
FROM Produto p
INNER JOIN Categoria c ON p.id_categoria = c.id_categoria
WHERE p.qtde_produto < 7;

-- 6. Dados Iniciais
INSERT INTO Categoria (nome_categoria) VALUES ('Informática'), ('Escritório'), ('Móveis');
INSERT INTO Usuario (login, senha) VALUES ('admin', '1234');