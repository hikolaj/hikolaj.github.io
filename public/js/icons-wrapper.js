const iconsWrapper = document.getElementsByClassName("icons-wrapper")[0];
const wrappedIcons = iconsWrapper.getElementsByClassName("icon");
const iconsAmount = wrappedIcons.length;

const speed = 0.25;

const tickDelay = 100;
var tickTimer = 0;

var firstId = 0;
var iconOffset = 0;



const tick = () =>
{
    const iconWidth = wrappedIcons[0].offsetWidth;
    const wrapperWidth = iconsWrapper.offsetWidth + iconWidth;

    var partialWidth = wrapperWidth/iconsAmount;

    iconOffset -= partialWidth/tickDelay * speed;
    if(iconOffset < 0){
        iconOffset += partialWidth;
        incrementFirstID();
    }

    for(var i = 0; i < iconsAmount; i++){
        var iconId = calculateIconId(i);
        wrappedIcons[iconId].style.left = ''+(wrapperWidth/iconsAmount*i + iconOffset - iconWidth)+'px';
    }


    tickTimer += tickDelay/1000;
    window.requestAnimationFrame(tick);
}
tick();

function incrementFirstID(){
    firstId +=1;
    if(firstId >= iconsAmount){
        firstId = 0;
    }
}

function calculateIconId(i){
    var id = firstId + i;
    if(id >= iconsAmount){
        id -= iconsAmount;
    }
    return id;
}