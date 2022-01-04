
InitializeGalleries();
function InitializeGalleries()
{
  var galleries = document.getElementsByClassName("gallery");
  for(var i = 0; i < galleries.length; i++)//initialize every gallery
  {
    var gallery = galleries[i];
    var imgs = gallery.getElementsByTagName("img");
    if(imgs.length > 1)
    {
      gallery.dataset.value = 0;

      //setup buttons to scroll gallery
      var btnLeft = document.createElement('div');
      btnLeft.className = 'gallery-btn--left';
      btnLeft.addEventListener("click", HandleGalleryBtnAction.bind(null, gallery, -1));
      gallery.appendChild(btnLeft);

      var btnRight = document.createElement('div');
      btnRight.className = 'gallery-btn--right';
      btnRight.addEventListener("click", HandleGalleryBtnAction.bind(null, gallery, 1));
      gallery.appendChild(btnRight);

      //setup marks container
      var marksContainer = document.createElement('div');
      marksContainer.className = 'gallery-marks';
      gallery.appendChild(marksContainer);

      for(var imgId = 0; imgId < imgs.length; imgId++)// setup marks and turn off imgs
      {
        var mark = document.createElement('div');
        mark.className = 'gallery-mark';
        if(imgId == 0)
        {
          mark.classList.add("gallery-mark--fill");
        }else{
          imgs[imgId].classList.add("gallery-img--off");
        }
        marksContainer.appendChild(mark);
      }

    }
  }
}

function HandleGalleryBtnAction(gallery, direction)
{
  var imgs = gallery.getElementsByTagName("img");
  var marks = gallery.getElementsByClassName("gallery-marks")[0].getElementsByClassName("gallery-mark");
  var activeMarkId = parseInt(gallery.dataset.value, 10);

  //calculate new mark id
  var newMarkId = 0;
  if(activeMarkId + direction < 0){
    newMarkId = imgs.length-1;
  }else if(activeMarkId + direction >= imgs.length){
    newMarkId = 0;
  }else{
    newMarkId = activeMarkId + direction;
  }
  //setup imgs
  imgs[activeMarkId].classList.add("gallery-img--off");
  imgs[newMarkId].classList.remove("gallery-img--off");
  //setup marks
  marks[activeMarkId].classList.remove("gallery-mark--fill");
  marks[newMarkId].classList.add("gallery-mark--fill");

  //save new active img id
  gallery.dataset.value = newMarkId;
}
