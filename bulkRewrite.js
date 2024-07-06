const { mongoose } = require('mongoose');
const { AtlasDbUrl } = require('./config.json');
const Log = require('./models/Log');

console.log("Hello   World");

// Get all logs that are of the unit "Chars"

// Go through one by one, divide points by 2 and save

// Done

// (async () => {
//     // Connect to DB
//     await mongoose.connect(AtlasDbUrl)

//     // Get all logs that are of the unit "Chars"
//     let allLogs = await Log.find({ unit: "Chars" }).exec();;
//     console.log(allLogs.length);
    
//     // Go through 1 by 1 devide points by 2 and save
//     const updateQueries = [];
//     allLogs.forEach(async (item) => {
//         updateQueries.push({
//           updateOne: {
//             filter: { _id: item._id },
//             update: { points: item.points/2 },
//           },
//         });
//       });
//     // console.log(JSON.stringify(updateQueries));
//     await Log.bulkWrite(updateQueries);
// })()


