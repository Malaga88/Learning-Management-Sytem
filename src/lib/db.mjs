import mongoose from "mongoose";

const mongodb_Url = process.env.MONGODB_URL || "mongodb://localhost:27017/LMS";

let cached = global.mongoose;
if(!cached){
    cached = global.mongoose = {
        conn: null, 
        promise: null};
}
async function connectToMongoDB(){
    if(cached.conn){
        return cached.conn;
    }
    if(!cached.promise){
        const opts = {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        };
        cached.promise = mongoose.connect(mongodb_Url, opts).then((mongoose)=>{
            return mongoose;
        });
    }
    try{
        cached.conn = await cached.promise;
    }catch(err){
        cached.promise = null;
        throw err;
    }
    return cached.conn;
}
export default connectToMongoDB;