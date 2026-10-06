@echo off
chcp 65001 > nul
title GameWeb
cd /d "%~dp0"

where node > nul 2>&1
if errorlevel 1 (
  echo Node.js nao encontrado. Instale a versao LTS em https://nodejs.org e execute de novo.
  pause
  exit /b 1
)

if not exist node_modules (
  echo Instalando dependencias...
  call npm install
)
if not exist public\emu\ejs\loader.js (
  echo Baixando emuladores e jogos livres ^(somente na primeira vez^)...
  call npm run setup
)

echo.
echo  GameWeb iniciando em http://localhost:3000
echo  Painel admin em  http://localhost:3000/admin
echo  Para encerrar, feche esta janela ou pressione Ctrl+C.
echo.
start "" cmd /c "timeout /t 3 /nobreak > nul & start http://localhost:3000"
node server.js
pause
