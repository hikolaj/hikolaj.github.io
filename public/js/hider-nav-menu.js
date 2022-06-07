const tabButtons = document.getElementsByClassName("nav-link-btn");
const tabs = document.getElementsByClassName("tab");
const burgerBtn = document.getElementsByClassName("btn-burger")[0];
const navigationBar = document.getElementById("navigation");
const header = document.getElementById("header");

const tabOpenName = "tab-open";
const tabClosedName = "tab-closed";

const headerOpenName = "header-open";
const headerClosedName = "header-closed";

var lastActiveTab = 0;

var menuIsOpen = false;



//  Initialization
initializeNavButtons();
function initializeNavButtons()
{
  for(var i = 0; i < tabButtons.length; i++)
  {
    var btn = tabButtons[i];
    btn.addEventListener("click", navButtonAction.bind(null, i));
    btn.classList.remove("active");
  }

  header.classList.add(headerOpenName);

  for(var i=0; i<tabs.length; i++)
  {
    tabs[i].classList.add(tabClosedName);
  }

  burgerBtn.addEventListener("click", toggleMenu);
  console.log("hider-nav-mesh Initialized.");
}


function navButtonAction(id)
{
  activateNavButton(id);
  closeMenu();

  if(id > 0)//close header
  {
    closeTab(0);
  }

  if(lastActiveTab != id){
    openTab(id);
    closeTab(lastActiveTab);
    lastActiveTab = id;
  }
}

function openTab(id)
{
  if(id == 0)//header
  {
    header.classList.add(headerOpenName);
    header.classList.remove(headerClosedName);
  }
  else//tab
  {
    var tab = tabs[id-1];
    tab.classList.add(tabOpenName);
    tab.classList.remove(tabClosedName);   
  }
}

function closeTab(id)
{
  if(id == 0)//header
  {
    header.classList.remove(headerOpenName);
    header.classList.add(headerClosedName);
  }
  else//tab
  {
    var tab = tabs[id-1];
    tab.classList.add(tabClosedName);
    tab.classList.remove(tabOpenName);  
  }
}

//  Handle opening and closing menu
function toggleMenu()
{
  if(!menuIsOpen){
    closeTab(lastActiveTab);
    openMenu();
  }else{
    openTab(lastActiveTab);
    closeMenu();
  }
}

function openMenu()
{
  
  navigationBar.classList.add("nav-open");
  burgerBtn.classList.add("btn-burger-toggle");
  menuIsOpen = true;
}
function closeMenu()
{
  navigationBar.classList.remove("nav-open");
  burgerBtn.classList.remove("btn-burger-toggle");
  menuIsOpen = false;
}

//  Handle activation and deactivation of nav buttons
function activateNavButton(id)
{
  var lastActiveTabBtn = tabButtons[lastActiveTab];
  var btnToActivate = tabButtons[id];

  if(lastActiveTab != id)
  {
    //deactivate last button
    if(lastActiveTabBtn.classList.contains("active"))
    {
        lastActiveTabBtn.classList.remove("active");
    }

    //activate new active
    if(id > 0){
      btnToActivate.classList.add("active");
    }
  }
}

