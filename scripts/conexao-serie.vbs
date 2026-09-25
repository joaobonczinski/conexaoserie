' Alvo do atalho "Conexao Serie" da area de trabalho. Veio do Clickverse.
' Existe so para rodar o lancador.mjs SEM janela de terminal: o 0 no Run e
' "janela oculta", e o False e "nao esperar terminar". O lancador cuida do
' resto (agenda do GitHub, servidor em segundo plano, build so quando algo mudou).
'
' SEM ACENTO NESTE ARQUIVO, nem em comentario: o wscript le .vbs como ANSI, e
' um acento em UTF-8 vira lixo — inofensivo num comentario, fatal numa string.
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
raiz = fso.GetParentFolderName(fso.GetParentFolderName(WScript.ScriptFullName))
shell.CurrentDirectory = raiz
shell.Run "node """ & raiz & "\scripts\lancador.mjs""", 0, False
