class ApiError extends Error{
    constructor(
        statusCode,
        message= "Something Went Wrong",
        error = [],
        stack = ""
    ){
        // Override
        super(message)
        this.statusCode = statusCode
        // data is null because you're representing a failure.
        this.data = null
        this.message = message
        this.success = false
        this.error = error

        if (stack) {
            this.stack = stack
        }else{
            // Stack trace main humne instance pass kar diya hai ki vo kis context main hai 
            Error.captureStackTrace(this, this.constructor)
        }


    }
}

export { ApiError }