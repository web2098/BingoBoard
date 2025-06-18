let prompt_timeout = null;
let audience_interaction_cb = null;
function updateRectangleSize()
{
    //remove any existing circles
    const container = document.querySelector('.container');
    container.style.display = 'block';
    //Find all children with className cicle
    const circles = container.querySelectorAll('.circle');
    circles.forEach(circle => {
        circle.remove();
    });

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // const rectWidth = 960;
    // const rectHeight = 216;
    const rect = container.getBoundingClientRect();
    const styles = window.getComputedStyle(container);

    // Get border sizes
    const borderTop = parseFloat(styles.borderTopWidth);
    const borderBottom = parseFloat(styles.borderBottomWidth);
    const borderLeft = parseFloat(styles.borderLeftWidth);
    const borderRight = parseFloat(styles.borderRightWidth);

    const rectWidth = rect.width;
    const rectHeight = rect.height;
    const circleSize = borderTop * .7; // radius of circles
    const circleSpacing = circleSize  * 1.1; // Space between circles

    function createCircle(x, y, delay) {
        const circle = document.createElement('div');
        circle.classList.add('circle');
        circle.className = 'circle';
        circle.style.left = `${x - (borderTop) + (borderTop - circleSize)/2}px`;
        circle.style.top = `${y - (borderTop) + (borderTop - circleSize)/2}px`;
        circle.style.width = `${circleSize}px`;
        circle.style.height = `${circleSize}px`;
        container.appendChild(circle);
    }

    let delayCounter = 0;
    // Top Edge
    //createCircle(0, 0, delayCounter * 0.1);
    //createCircle(rectWidth - borderTop, 0, delayCounter * 0.1);
    const distanceHorizonalBetween = rectWidth - 2 * borderTop;
    const numHorizonalCircles = Math.floor(distanceHorizonalBetween / circleSpacing);
    for (let i = 0; i < numHorizonalCircles; i++) {
        const x = borderTop + i * circleSpacing;
        createCircle(x, 0, delayCounter * 0.1);
        delayCounter++;
    }


    //createCircle(0, rectHeight - borderTop, delayCounter * 0.1);
    //createCircle(rectWidth - borderTop, rectHeight - borderTop, delayCounter * 0.1);
    for (let i = 0; i < numHorizonalCircles; i++) {
        const x = borderTop + i * circleSpacing;
        createCircle(x, rectHeight - borderTop, delayCounter * 0.1);
        delayCounter++;
    }

    const distanceVerticalBetween = rectHeight - 2 * borderTop;
    const numVerticalCircles = Math.floor(distanceVerticalBetween / circleSpacing);
    for (let i = 0; i < numVerticalCircles; i++) {
        const y = borderTop + i * circleSpacing;
        createCircle(0, y, delayCounter * 0.1);
        delayCounter++;
    }

    for (let i = 0; i < numVerticalCircles; i++) {
        const y = borderTop + i * circleSpacing;
        createCircle(rectWidth - borderTop, y, delayCounter * 0.1);
        delayCounter++;
    }
}

function showAudienceInteraction(type, options)
{
    const message = getItemWithDefault(type);

    if( audience_interaction_cb !== null )
    {
        audience_interaction_cb(type, options);
    }

    //If prompt_timeout is not null clear it and make it null
    if( prompt_timeout !== null )
    {
        clearTimeout(prompt_timeout);
        prompt_timeout = null;
    }

    const paragraph = document.createElement('p');
    paragraph.className = 'blink-text';
    paragraph.innerHTML = message;
    paragraph.style.width = "100%";
    paragraph.style.height = "100%";
    //Center text vertical annd horizontally
    paragraph.style.display = "flex";
    paragraph.style.justifyContent = "center";
    paragraph.style.alignItems = "center";
    paragraph.style.fontSize = "1000%";
    if( options && options.font_size )
    {
        paragraph.style.fontSize = options.font_size;
    }
    //Clip


    const death_msg = document.getElementById('death_msg');
    death_msg.style.display = 'none';

    const rectangle = document.querySelector('.rectangle');
    //Clip in rectangle
    //remove any existing paragraphs
    const paragraphs = rectangle.querySelectorAll('p');
    paragraphs.forEach(paragraph => {
        paragraph.remove();
    });

    //add paragraph to rectangle
    rectangle.appendChild(paragraph);

    //Show modal and start a 5 second timer to hide it
    const modal = document.querySelector('.modal');
    modal.style.display = 'block';
    // Set background color to rgba(0,0,0,.8)
    modal.style.background = "none";
    modal.style.backgroundColor = 'rgba(0,0,0,.8)';

    const value = getItemWithDefault('audience-message-timeout');
    const timeout = parseInt(value);

    updateRectangleSize();
    prompt_timeout = setTimeout(() => {
        modal.style.display = 'none';
    }, timeout);

}

function showToTheDeath(options)
{
    //check if modal is already open
    const modal = document.querySelector('.modal');
    if( modal.style.display === 'block' )
    {
        //Hide the model
        modal.style.display = 'none';
        return;
    }

    const container = document.querySelector('.container');
    container.style.display = 'none';
    modal.style.display = 'block';


    let isGraphic = getItemWithDefault('to-the-death-graphic');
    const death_msg = document.getElementById('death_msg');

    if( options && options.isGraphic !== undefined)
    {
        isGraphic = options.isGraphic; // Override if provided in options
    }

    if( isGraphic === 'true' )
    {
        modal.style.background = "no-repeat center/cover url('to_the_death.jpg')";
        death_msg.style.display = 'none';
    }
    else
    {
        death_msg.style.display = 'block';
        modal.style.background = 'black';
    }

    if( audience_interaction_cb !== null )
    {
        audience_interaction_cb("skull", {isGraphic: isGraphic});
    }

    //Fully black
    modal.style.backgroundColor = 'black';
    function clickHandler(event) {
        modal.style.display = 'none';
        console.log("Hide modal");
        document.removeEventListener('click', clickHandler);
        if( audience_interaction_cb !== null )
        {
            audience_interaction_cb('skull', {isGraphic: isGraphic});
        }
    }
    document.addEventListener('click', clickHandler);
}


function create_audience_interaction()
{
    document.addEventListener('keydown', function(event) {
        if (event.key === '1' || event.key === 'a') {
            showAudienceInteraction('clap-message', {});
        } else if (event.key === '2' || event.key === 'b')  {
            showAudienceInteraction('boo-message', {});
        } else if (event.key === '3' || event.key === 'd') {
            showAudienceInteraction('beer-message', {});
        } else if (event.key === '4' || event.key === 'w') {
            showAudienceInteraction('party-message', {});
        } else if (event.key === '5' || event.key === 'x') {
            showToTheDeath({});
        }
    });

    return create_audience_interaction_ui();
}


function executeOrder66(enable_audio)
{
    //If prompt_timeout is not null clear it and make it null
    if( prompt_timeout !== null )
    {
        clearTimeout(prompt_timeout);
        prompt_timeout = null;
    }
    //check if modal is already open
    const modal = document.querySelector('.modal');
    if( modal.style.display === 'block' )
    {
        //Hide the model
        modal.style.display = 'none';
        return;
    }

    const container = document.querySelector('.container');
    container.style.display = 'none';
    modal.style.display = 'block';


    const death_msg = document.getElementById('death_msg');
    //Check death_msg is defined
    if( death_msg != null )
    {
        death_msg.style.display = 'none';
    }

    // With this:
    modal.style.background = "black";  // Set base background
    modal.style.backgroundImage = "url('order663.gif')";
    modal.style.backgroundPosition = "center";
    modal.style.backgroundRepeat = "no-repeat";
    modal.style.backgroundSize = "contain"; // 'contain' keeps aspect ratio and fits the entire image
    prompt_timeout = setTimeout(() => {
        modal.style.display = 'none';
        container.style.display = 'block';
    }, 3000);

    if( enable_audio )
    {
        //Play the mp3 file order66.mp3
        const audio = new Audio('order66.mp3');
        audio.play();

        //When the audio ends hide the modal
        audio.addEventListener('ended', function() {
            modal.style.display = 'none';
            container.style.display = 'block';
        });
    }
}

function create_audience_interaction_ui()
{
    const emoji_actions = document.createElement('emoji_actions');
    emoji_actions.id = 'emoji_actions';

    const clap = document.createElement('p');
    clap.id = 'clap';
    clap.innerHTML = "&#x1F44F;";

    clap.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction('clap-message', {});
    });

    // Add ghost and beer glass cheers
    const ghost = document.createElement('p');
    ghost.id = 'ghost';
    ghost.innerHTML = "&#x1F47B;";

    ghost.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction('boo-message', {});
    });

    const beer = document.createElement('p');
    beer.id = 'beer';
    beer.innerHTML = "&#x1F37B;";
    beer.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction('beer-message', {});
    });
    // Add a party emoji
    const party = document.createElement('p');
    party.id = 'party';
    party.innerHTML = "&#x1F973;";
    party.addEventListener('click', function(event) {
        event.stopPropagation();
        showAudienceInteraction('party-message', {});
    });
    // Add a skull crossbones emoji
    const skull = document.createElement('p');
    skull.id = 'skull';
    skull.innerHTML = "&#x2620;";
    skull.addEventListener('click', function(event) {
        event.stopPropagation();
        showToTheDeath({});
    });


        //add a lightsaber emoji using image lightsaber.png
        const saber = document.createElement('img');
        saber.id = 'saber';
        saber.src = 'lightsaber.png';
        saber.style.width = '50px';
        saber.style.height = '50px';
        saber.addEventListener('click', function(event) {
            event.stopPropagation();
            executeOrder66(true);
        });


    emoji_actions.append(clap);
    emoji_actions.append(ghost);
    emoji_actions.append(beer);
    emoji_actions.append(party);
    emoji_actions.append(skull);

    if( getItemWithDefault('auto-lightsaber') === 'true' )
    {
        add_special_number_interaction(66, function(){
            executeOrder66(true);
        });
    }
    else
    {
        emoji_actions.append(saber);
    }

    return emoji_actions;
}

function registerAudienceInteractionCallback(callback)
{
    if( typeof callback === 'function' )
    {
        audience_interaction_cb = callback;
    }
    else
    {
        console.error("Callback is not a function");
    }
}