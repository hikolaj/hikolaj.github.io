const headerObj = document.getElementsByClassName("header")[0];

document.addEventListener('scroll', updateHeaderSize);

const minHeight = 0;
const activateAtPartOfScreen = 3.5;

var wheelValue = 0;
updateHeaderSize();
function updateHeaderSize(){
  var y = window.scrollY;
  headerObj.style.backgroundPosition = 0+" "+ (-200+ y / 2)+"px";
}
