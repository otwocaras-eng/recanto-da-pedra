<?php
// Recanto da Pedra — Versão em Espanhol (es)
// Permite indexação direta pelo Googlebot em /pousada/es/
$_GET['lang'] = 'es';

// Captura o HTML base
$html = file_get_contents(__DIR__ . '/../index.html');

// Injeta o idioma e metadados iniciais no HTML para motores de busca e crawlers sociais
$html = preg_replace('/<html lang="[^"]*"/', '<html lang="es"', $html);
$html = preg_replace('/initialLang = \'pt-BR\'/', 'initialLang = \'es\'', $html);

// Ajusta caminhos relativos de css, js e locales para o subdiretório
$html = str_replace('href="css/', 'href="../css/', $html);
$html = str_replace('src="js/', 'src="../js/', $html);
$html = str_replace('<head>', "<head>\n  <script>window.RECANTO_I18N_BASE_PATH = '../locales/';</script>", $html);

echo $html;
