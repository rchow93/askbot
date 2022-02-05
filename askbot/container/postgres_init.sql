CREATE USER askbot WITH PASSWORD 'askB0T!';
ALTER ROLE askbot SET client_encoding TO 'utf8';
ALTER ROLE askbot SET default_transaction_isolation TO 'read committed';
ALTER ROLE askbot SET timezone TO 'UTC';
ALTER USER askbot CREATEDB;
CREATE DATABASE askbottest OWNER=askbot;
