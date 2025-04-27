const asyncHandler = (responseHandler) => (req, res, next) => {
    Promise.resolve(
        responseHandler(req, res, next)
    ).catch((err) => next(err))
}

export { asyncHandler }















// Wrapper Function example --->

// const asyncHandler1 = () =>{ ()=>{}}
// const asyncHandler2 = () =>()=>{}
// const asyncHandler3 = () => async ()=>{}

// using try catch and async await ---->

// const asyncHandler4 = (fn) => async (req, res, next) => {
//     try {
//         await fn(req, res, next)
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }