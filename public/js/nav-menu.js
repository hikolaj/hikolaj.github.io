
const underlineLogo = false;
const scrollToOffset = -80;// offset of scrollTo function
const scrollDetectionHeightDivider = 1.8;// nav detects change of supbage at position > wh/Divider; -window.innerHeight/scrollDetectionHeightDivider;

const buttons = document.getElementsByClassName("nav-link-btn");
const subpages = document.getElementsByClassName("nav-link");
const burgerBtn = document.getElementsByClassName("nav-btn--burger")[0];
const navigationBar = document.getElementsByClassName("navigation")[0];

var lastActiveSubpage = 0;

const scrollAnimationTimer = 1000;
var scrollAnimationIsActive = false;
var scrollAnimationResetInterval;

var menuIsOpen = false;



//  Initialization
initializeNavButtons();
function initializeNavButtons(){
  for(var i=0; i<buttons.length; i++){
    var btn = buttons[i];
    btn.addEventListener("click", navButtonAction.bind(null, i));
    if(btn.classList.contains("active")){
        btn.classList.remove("active");
    }
  }
  if(underlineLogo){
    buttons[0].classList.add("active");
  }
  burgerBtn.addEventListener("click", toggleMenu);
  document.addEventListener('scroll', handleNavByScrolling);
}


//  Scroll to supbage/nav-link of a button
function navButtonAction(id){
  scrollToSubpage(id);
  activateNavButton(id);
  closeMenu();

  if(scrollAnimationResetInterval != null){
    clearInterval(scrollAnimationResetInterval);
  }
  scrollAnimationResetInterval = setInterval(function(){resetScrollActivation()}, scrollAnimationTimer);
  scrollAnimationIsActive = true;
}

//  Handle opening and closing menu
function toggleMenu(){
  if(!menuIsOpen){
    openMenu();
  }else{
    closeMenu();
  }
}

function openMenu(){
  navigationBar.classList.add("nav-open");
  burgerBtn.classList.add("btn--burger-toggle");
  menuIsOpen = true;
}
function closeMenu(){
  navigationBar.classList.remove("nav-open");
  burgerBtn.classList.remove("btn--burger-toggle");
  menuIsOpen = false;
}

//  Auto detection of active subpage
function handleNavByScrolling()
{
  if(!scrollAnimationIsActive)
  {
    var yScrollOffset = -window.innerHeight/scrollDetectionHeightDivider;
    var y = window.scrollY;

    if(y == 0)//home
    {
      activateNavButton(0);
    }
    else if(y >= document.body.clientHeight - window.innerHeight)//end
    {
      activateNavButton(subpages.length - 1);
    }
    else//between
    {
      for(var i = 0; i < subpages.length; i++)
      {
        var subpage = subpages[i];
        if(getSubpageOffset(subpage).top + subpage.offsetHeight + yScrollOffset > y)
        {
          activateNavButton(i);
          return;
        }
      }
    }

  }
}

//  ScrollTo subpage
function scrollToSubpage(id){
  var yPos = getSubpageOffset(subpages[id]).top;
  if(yPos > -scrollToOffset){
    yPos += scrollToOffset;
  }
  window.scrollTo(0, yPos);
}

//  Handle activation and deactivation of nav buttons
function activateNavButton(id){
  var lastActiveSubpageBtn = buttons[lastActiveSubpage];
  var btnToActivate = buttons[id];

  if(lastActiveSubpage != id){
    //deactivate last button
    if(lastActiveSubpageBtn.classList.contains("active")){
        lastActiveSubpageBtn.classList.remove("active");
    }

    //activate new active
    if(id > 0){
      btnToActivate.classList.add("active");
    }else{
      if(underlineLogo){
        btnToActivate.classList.add("active");
      }
    }
  }

  lastActiveSubpage = id;
}

//  Interval that resets scrolling animation to prevent bug. (auto scrolling is detected as user scroll and buttons can flicker)
function resetScrollActivation(){
  scrollAnimationIsActive = false;
  clearInterval(scrollAnimationResetInterval);
  scrollAnimationResetInterval = null;
}

//  Calculate position in the body of an given element
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
