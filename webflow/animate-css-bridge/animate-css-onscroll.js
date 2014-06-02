var animationTypes = [
    'bounce',
    'flash',
    'pulse',
    'rubberBand',
    'shake',
    'swing',
    'tada',
    'wobble',
    'bounceIn',
    'bounceInDown',
    'bounceInLeft',
    'bounceInRight',
    'bounceInUp',
    'bounceOut',
    'bounceOutDown',
    'bounceOutLeft',
    'bounceOutRight',
    'bounceOutUp',
    'fadeIn',
    'fadeInDown',
    'fadeInDownBig',
    'fadeInLeft',
    'fadeInLeftBig',
    'fadeInRight',
    'fadeInRightBig',
    'fadeInUp',
    'fadeInUpBig',
    'fadeOut',
    'fadeOutDown',
    'fadeOutDownBig',
    'fadeOutLeft',
    'fadeOutLeftBig',
    'fadeOutRight',
    'fadeOutRightBig',
    'fadeOutUp',
    'fadeOutUpBig',
    'flip',
    'flipInX',
    'flipInY',
    'flipOutX',
    'flipOutY',
    'lightSpeedIn',
    'lightSpeedOut',
    'rotateIn',
    'rotateInDownLeft',
    'rotateInDownRight',
    'rotateInUpLeft',
    'rotateInUpRight',
    'rotateOut',
    'rotateOutDownLeft',
    'rotateOutDownRight',
    'rotateOutUpLeft',
    'rotateOutUpRight',
    'slideInDown',
    'slideInLeft',
    'slideInRight',
    'slideOutLeft',
    'slideOutRight',
    'slideOutUp',
    'hinge',
    'rollIn',
    'rollOut',
];

var animatedSelectors = '.'+animationTypes.join(', .').toLowerCase();
var animatedPostSelectors = '.animated'+animationTypes.join(', .animated.').toLowerCase();
var style = document.createElement('style');
var text = document.createTextNode(animatedSelectors+'{opacity:0;}'+animatedPostSelectors+'{opacity:1;}');
style.appendChild(text);
document.getElementsByTagName('head')[0].appendChild(style);

var animatedElements = document.querySelectorAll(animatedSelectors);

for(var i = 0;i<animatedElements.length;i++){
    for (var j = 0;j<animationTypes.length;j++){
        if(animatedElements[i].classList.contains(animationTypes[j].toLowerCase())){
            animatedElements[i].setAttribute('data-animation', animationTypes[j]);
        }
    }
}

window.onscroll = function(){
    var viewPortHeight = window.innerHeight, elementRect, Element, classList, offset, animatedClass;
    animatedClass = 'animated';
    offset = 200;
    for(var i=0;i<animatedElements.length;i++){
        Element = animatedElements[i];
        elementRect = Element.getBoundingClientRect();
        if(elementRect.top < viewPortHeight - offset){
            classList = Element.classList;
            if(!classList.contains(animatedClass)){
                classList.add(animatedClass);
                Element.classList.add(Element.getAttribute('data-animation'));
            }
        }
    }
};