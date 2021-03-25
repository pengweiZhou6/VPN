const assert = require('assert').strict;

// Set a 1 min timeout to validate authentication requests
const timeout = 60000

const getTimestamp = () => {
    return Date.now();
}

const incrementTimestamp = (time) => {
    return time + 1;
}

const validateTimestamp = (time) => {
    const currTime = Date.now();
    if (currTime - time > timeout)
        return false;
    else
        return true;
}

const timeTestDriver = () => {
    const testTime = 1001;
    const testTimeIncrement = incrementTimestamp(testTime);

    assert(testTimeIncrement == 1002);

    const invalidTime = getTimestamp() - (timeout + 1);
    const validTime = getTimestamp() - (timeout / 2);

    const invalidTimeTest = validateTimestamp(invalidTime);
    const validTimeTest = validateTimestamp(validTime);

    assert(invalidTimeTest == false);
    assert(validTimeTest == true);

    console.log("Timestamp tests have passed");
}

module.exports = {
    getTimestamp,
    incrementTimestamp,
    validateTimestamp,
    timeTestDriver,
}
