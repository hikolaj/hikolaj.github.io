
SetGlitchData();
function SetGlitchData()
{
  var glitchElements = document.getElementsByClassName("glitch");

  for(var i = 0; i < glitchElements.length; i++)
  {
    var element = glitchElements[i];
    element.setAttribute("data-text", element.innerText);
  }
}

