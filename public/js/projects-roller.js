const roller = document.getElementsByClassName("roller")[0];
const rollerContainer = document.getElementsByClassName("roller-btn-container")[0];
const rollerBtn = document.getElementsByClassName("roller-btn")[0];

const rolledRollerText = "Pokaż więcej projektów";
const unrolledRollerText = "Zwiń projekty";


var rolled = true;

initializeRoller();
function initializeRoller(){
    if(rolled)
    {
      roll();
    }else
    {
      unroll();
    }
    rollerBtn.addEventListener("click", toggleRoller);
}

function toggleRoller(){
    if(rolled)
    {
        unroll();
    }
    else
    {
        roll();
    }
}

function roll(){
    if(!roller.classList.contains("rolled"))
    {
        roller.classList.add("rolled");
    }
    rollerBtn.textContent = rolledRollerText;
    rolled = true;
}

function unroll(){
    if(roller.classList.contains("rolled"))
    {
        roller.classList.remove("rolled");
    }
    rollerBtn.textContent = unrolledRollerText;
    rolled = false;
}