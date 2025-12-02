@echo off
rem - Estas etapas são para criar uma nova action
npm init
npm install @actions/github
npm install @actions/core
npm install -g @vercel/ncc
rem - Build the action, toda vez que você alterar o código da action, você precisa buildar novamente
-- ncc build .\index.js --license licenses.txt
@echo on