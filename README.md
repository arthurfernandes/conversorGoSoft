###Projeto de conversão de dados para plataforma GoSoft

>Esse projeto consiste na conversão de dados preenchidos via formulário web e de uma planilha excel para um formato definido nas especificações (ver pasta specs exemplos)
####Especificações da planilha:
>Deve conter o primeiro bloco na célula A10
>Cada bloco deve ser o formato "Bloco " seguido do identificador que se deseja para o bloco. Exemplo: "Bloco A1" identifico o bloco com identificador A1.
>Após bloco devem ser separadas três células abaixo para o primeiro apartamento. Portanto o primeiro apartamento se inicia na A13
>Após o último apartamento reserve a célula de baixo em branco para que o próximo bloco seja identificado logo abaixo. Exemplo: Último apartamento em A17, deixe A18 em branco e escreva "Bloco A2" em A19 para identificar o bloco A2.
>Se após o apartamento existirem duas linhas em branco o programa irá parar assumindo que não existem mais blocos.

###Funcionalidades Interessantes

1. Adição de Arquivo via Drag and Drop
2. Download e Importação de Arquivo JSON usando a biblioteca FileSaver.js
3. Parser de uma planilha xslx utilizando a biblioteca sheetjs além de jszip.js para abertura de arquivo.

>>Documentação sobre parser de xlsx se encontra em: http://open-school-for-all.blogspot.com.br/2013/11/reading-excel-sheet-on-client-side-and.html
