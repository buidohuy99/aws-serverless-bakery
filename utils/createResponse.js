module.exports.createResponse = (body = {}, statusCode) => {
    return {
        statusCode: statusCode,
        body: JSON.stringify(
            body
        ),
    };
}