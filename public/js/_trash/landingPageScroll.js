var landingPageActive = true;
var landingPage = document.getElementsByClassName("LandingPage")[0];
var arrowDiv = document.getElementById("LandingPageArrow");

function ScrollLandingPage(forceToggle)
{
  var height = Math.round(window.innerHeight - window.scrollY*2);

  if(landingPageActive && (forceToggle || window.scrollY > 0))
  {
    landingPage.style.height = "50px";
    arrowDiv.style.transform = "rotate(225deg)";
    window.scrollTo(0, 200);
    landingPageActive = false;
  }
  else if(forceToggle || window.scrollY <= 0)
  {
    landingPage.style.height = "100%";
    arrowDiv.style.transform = "rotate(45deg)"
    landingPageActive = true;
  }
}

let ticking = false;

document.addEventListener('scroll', function(e) {

  if (!ticking) {
    window.requestAnimationFrame(function() {
      ScrollLandingPage(false);
      ticking = false;
    });

    ticking = true;
  }
});
