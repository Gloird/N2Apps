function doGet(){
    return HtmlService.createTemplateFromFile('frontend/index')
        .evaluate()
        .setTitle('N2Apps')
        .setSandboxMode(HtmlService.SandboxMode.IFRAME)
        .setFaviconUrl('https://fonts.gstatic.com/s/e/notoemoji/15.1/1f5b1_fe0f/32.png');
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
      .getContent();
}