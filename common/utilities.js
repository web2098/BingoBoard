

function get_spot_id(id)
{
    const letters = ['B', 'I', 'N', 'G', 'O'];
    //If id is a string and the first character is in letters then remove it
    if( typeof id === 'string' && letters.includes(id[0]) )
    {
        id = id.substring(1);
    }

    id = parseInt(id);
    const letter = letters[Math.floor((id - 1)/15)];
    const number = letter + id;
    return number;
}

function getQueryParams( keys ) {
    const params = new URLSearchParams(window.location.search);

    const result = {};
    keys.forEach(key => {
        result[key] = params.get(key);
    });
    return result;
}

