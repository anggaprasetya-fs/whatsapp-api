const formatNumber  = (number) => {

    if (!number.endsWith('@c.us'))
    {
        number += '@c.us';    
    }

    return number;
}

module.exports = {
    formatNumber
}