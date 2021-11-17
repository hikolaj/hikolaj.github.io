const yOffset = -50;
const yScrollOffsetDivider = 2.5;
const buttons = document.getElementsByClassName("nav-link-btn");
const subpages = document.getElementsByClassName("nav-link");

var lastActive = 0;

const scrollingTimer = 1000;
var scrollingTo = false;
var scrollResetInterval;


initializeNavButtons();
function initializeNavButtons(){
  for(var i=0; i<buttons.length; i++){
    var btn = buttons[i];
    btn.addEventListener("click", navButtonAction.bind(null, i));
    if(btn.classList.contains("active")){
        btn.classList.remove("active");
    }
  }
  buttons[0].classList.add("active");

  document.addEventListener('scroll', handleNavByScrolling);
}

function navButtonAction(id){
  scrollToSubpage(id);
  activateNavButton(id);

  if(scrollResetInterval != null){
    clearInterval(scrollResetInterval);
  }
  scrollResetInterval = setInterval(function(){resetScrollActivation()}, scrollingTimer);
  scrollingTo = true;
}

function handleNavByScrolling(){
  if(!scrollingTo){
    var yScrollOffset = -window.innerHeight/yScrollOffsetDivider;
    var y = window.scrollY;
    for(var i = 0; i < subpages.length; i++){
      var subpage = subpages[i];
      //console.log("id: " + i + " /top: " + getSubpageOffset(subpage).top + " /height: " + subpage.offsetHeight + " /sum with offset:" + getSubpageOffset(subpage).top + subpage.offsetHeight + yScrollOffset);
      if(getSubpageOffset(subpage).top + subpage.offsetHeight + yScrollOffset > y){
        activateNavButton(i);
        return;
      }
    }
  }
}

function scrollToSubpage(id){
  var yPos = getSubpageOffset(subpages[id]).top;
  if(yPos > -yOffset){
    yPos += yOffset;
  }
  window.scrollTo(0, yPos);
}

function activateNavButton(id){
  var lastActiveBtn = buttons[lastActive];
  var btnToActivate = buttons[id];

  //>>> More optimized version
  if(lastActive != id){
    //deactivate last button
    if(lastActiveBtn.classList.contains("active")){
        lastActiveBtn.classList.remove("active");
    }
    //activate new active
    btnToActivate.classList.add("active");
  }

  /*
  //>>> Safer but slower version
  for(var i=0; i<buttons.length; i++){
    var btn = buttons[i];
    if(btn.classList.contains("active")){
        btn.classList.remove("active");
    }
  }
  btnToActivate.classList.add("active");
  */

  lastActive = id;
}

function resetScrollActivation(){
  scrollingTo = false;
  clearInterval(scrollResetInterval);
  scrollResetInterval = null;
}


function getSubpageOffset(el) {
    var _x = 0;
    var _y = 0;
    while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
        _x += el.offsetLeft;
        _y += el.offsetTop;
        el = el.offsetParent;
    }
    return { top: _y, left: _x };
}
