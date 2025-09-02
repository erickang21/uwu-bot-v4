const { format } = require("date-fns");

class AnalyticsManager {
    /**
     * Stores the analytics data for this bot.
     * 
     * Server count is stored like this:
     * { _id: { type: "totalServerCount", date: "YYYY-MM-DD"}} -> { count: 1 }
     * 
     * Server segmented count is stored like this:
     * { _id: { type: "serverCount", date: "YYYY-MM-DD", range: "0-10"}} -> { count: 1 }
     * 
     * Command usage is stored like this:
     * { _id: { type: "commandUsage", date: "YYYY-MM-DD", command: "commandName"}} -> { count: 1 }
     * 
     * Command count is stored like this:
     * { _id: { type: "totalCommandCount", date: "YYYY-MM-DD"}} -> { count: 1 }
     */
    constructor(db, shard) {
        this.db = db;
        this.shard = shard;
        this.collection = this.db.collection("analytics");
        this.serverCount = 0;
        this.commandUsage = {}; // key: command name, value: count
        this.slashCommandCount = 0;
        this.textCommandCount = 0;
        this.commandErrors = {}; // key: error message, value: count
        // setInterval(() => this.saveCommandUses(), 60000); // Save command uses every minute
        this.usersToday = new Set();
        setInterval(() => this.saveUsersToday(), 60000); // Save users every minute
    }

    isBetween(value, min, max) {
        return min <= value && value <= max;
    }
    
    getInterval(serverSize) {
        if (this.isBetween(serverSize, 0, 9)) {
            return "0-9";
        } else if (this.isBetween(serverSize, 10, 24)) {
            return "10-24";
        } else if (this.isBetween(serverSize, 25, 49)) {
            return "25-49";
        } else if (this.isBetween(serverSize, 50, 99)) {
            return "50-99";
        } else if (this.isBetween(serverSize, 100, 249)) {
            return "100-249";
        } else if (this.isBetween(serverSize, 250, 499)) {
            return "250-499";
        } else if (this.isBetween(serverSize, 500, 999)) {
            return "500-999";
        } else if (this.isBetween(serverSize, 1000, 1999)) {
            return "1000-1999";
        } else if (this.isBetween(serverSize, 2000, 4999)) {
            return "2000-4999";
        } else if (this.isBetween(serverSize, 5000, 9999)) {
            return "5000-9999";
        } else {
            return "10000+";
        }
    }

    getTodayDateString() {
        return format(new Date(), 'yyyy-MM-dd');
    }

    async getServerCount(dateString) {
        const result = await this.collection.findOne({
            _id: { type: "totalServerCount", date: dateString },
        });
        if (!result) {
            return null;
        }
        return {
            count: result.count,
            increase: result.increase,
            decrease: result.decrease,
        };
    }

    async initialDailyServerUpdate(totalServers, serverSize, increase) {
        const today = this.getTodayDateString();

        const existing = await this.collection.findOne({
            "_id.type": "totalServerCount",
            "_id.date": today,
        });

        if (existing) {
            console.log(`[Analytics] Daily snapshot already exists for ${today}`);
            return true;
        }
        // Record total server count
        await this.collection.insertOne({ 
          _id: { type: 'totalServerCount', date: today },
          count: totalServers,
          lastUpdated: new Date(),
          increase: increase ? 1 : 0,
          decrease: increase ? 0 : 1,
        });
        // Record server count segmented by size
        const memberSizes = await this.shard.broadcastEval(() => {
            return this.guilds.cache.map(guild => guild.memberCount);
        })
        const memberSizeCounts = memberSizes.flat();
        const memberSizeMap = new Map();
        memberSizeCounts.forEach((size) => {
            const key = this.getInterval(size);
            memberSizeMap.set(key, (memberSizeMap.get(key) || 0) + 1);
        });
        memberSizeMap.forEach(async (totalServers, key) => {
            console.log(`Member Size Map: ${key}: ${totalServers}`);
            await this.collection.insertOne({
                _id: { type: "serverCount", date: today, range: key },
                count: totalServers,
                increase: increase && key === this.getInterval(serverSize) ? 1 : 0,
                decrease: !increase && key === this.getInterval(serverSize) ? 1 : 0,
                lastUpdated: new Date(),
            });
        })
        console.log(`[Analytics] Daily snapshot recorded for ${today} (${totalServers} servers)`);
        return false;
    }

    async initialDailyUserCountUpdate(totalUserCount, increase) {
        const today = this.getTodayDateString();

        const existing = await this.collection.findOne({
            "_id.type": "totalUserCount",
            "_id.date": today,
        });

        if (existing) {
            console.log(`[Analytics] Daily user count snapshot already exists for ${today}`);
            return true;
        }
        // Record total server count
        await this.collection.insertOne({ 
          _id: { type: 'totalUserCount', date: today },
          count: totalUserCount,
          lastUpdated: new Date(),
          increase: increase ? 1 : 0,
          decrease: increase ? 0 : 1,
        });
        console.log(`[Analytics] Daily snapshot recorded for ${today} (${totalUserCount} users)`);
        return false;
    }

    async serverJoined(serverSize, totalServers) {
        const today = this.getTodayDateString();
        if (!(await this.initialDailyServerUpdate(totalServers, serverSize,true))) {
            // Then server count was inserted, no need to update.
            return;
        }
        // Update total server count
        const dbUpdate = {
            updateOne: {
                filter: { _id: { type: "totalServerCount", date: today } },
                update: { 
                    $inc: { 
                        count: 1,
                        increase: 1,
                    },
                    $set: { lastUpdated: new Date() } 
                },
                upsert: true
            }
        };
        // Update server count segmented by size
        const dbSegmentUpdate = {
            updateOne: {
                filter: { _id: { type: "serverCount", date: today, range: this.getInterval(serverSize) } },
                update: { 
                    $inc: { 
                        count: 1,
                        increase: 1,
                    },
                    $set: { lastUpdated: new Date() } 
                },
                upsert: true
            }
        }
        await this.collection.bulkWrite([dbUpdate, dbSegmentUpdate]);
    }

    async serverJoinedUpdateUsers(userCount, totalUsers) {
        const today = this.getTodayDateString();
        if (!(await this.initialDailyUserCountUpdate(totalUsers, true))) {
            // Then server count was inserted, no need to update.
            return;
        }
        // Update total server count
        const dbUpdate = {
            updateOne: {
                filter: { _id: { type: "totalUserCount", date: today } },
                update: { 
                    $inc: { 
                        count: userCount,
                        increase: userCount,
                    },
                    $set: { lastUpdated: new Date() } 
                },
                upsert: true
            }
        };
        await this.collection.bulkWrite([dbUpdate]);
    }

    async serverLeft(serverSize, totalServers) {
        const today = this.getTodayDateString();
        if (!(await this.initialDailyServerUpdate(totalServers, false))) {
            // Then server count was inserted, no need to update.
            return;
        }
        // Update total server count
        const dbUpdate = {
            updateOne: {
                filter: { _id: { type: "totalServerCount", date: today } },
                update: { 
                    $inc: { 
                        count: -1,
                        decrease: 1,
                    },
                    $set: { lastUpdated: new Date() } 
                },
                upsert: true
            }
        };
        // Update server count segmented by size
        const dbSegmentUpdate = {
            updateOne: {
                filter: { _id: { type: "serverCount", date: today, range: this.getInterval(serverSize) } },
                update: { 
                    $inc: { 
                        count: -1,
                        decrease: 1,
                    },
                    $set: { lastUpdated: new Date() } 
                },
                upsert: true
            }
        }
        await this.collection.bulkWrite([dbUpdate, dbSegmentUpdate]);
    }

    async serverLeftUpdateUsers(userCount, totalUsers) {
        const today = this.getTodayDateString();
        if (!(await this.initialDailyUserCountUpdate(totalUsers, false))) {
            // Then server count was inserted, no need to update.
            return;
        }
        // Update total server count
        const dbUpdate = {
            updateOne: {
                filter: { _id: { type: "totalUserCount", date: today } },
                update: { 
                    $inc: { 
                        count: -userCount,
                        decrease: userCount,
                    },
                    $set: { lastUpdated: new Date() } 
                },
                upsert: true
            }
        };
        await this.collection.bulkWrite([dbUpdate]);
    }

    async commandUsed(commandName, userId, slash) {
        this.commandUsage[commandName] = (this.commandUsage[commandName] || 0) + 1;
        if (slash) this.slashCommandCount++;
        else this.textCommandCount++;
        this.usersToday.add(userId);
    }

    // gets run only once (not among all shards) - check uwuReady.js
    async saveCommandUses(commandUsage, slashCount, textCount) {
        const bulkOps = [];
        const today = this.getTodayDateString();
        // DAY SPECIFIC
        // All command uses count today:
        bulkOps.push({
            updateOne: {
                filter: { _id: { type: "allCommandUsage", date: today } },
                update: { $inc: { slashCount, textCount } },
                upsert: true,
            }
        });
        // LIFETIME
        bulkOps.push({
            updateOne: {
                filter: { _id: { type: "commandUsageTotal" } },
                update: { $inc: { slashCount, textCount } },
                upsert: true,
            }
        });
        // Command usage by command:
        Object.entries(commandUsage).forEach(([command, count]) => {
            // DAY SPECIFIC
            bulkOps.push({
                updateOne: {
                    filter: { _id: { type: "commandUsage", date: today, command } },
                    update: { $inc: { count } },
                    upsert: true,
                },
            });
            // LIFETIME
            bulkOps.push({
                updateOne: {
                    filter: { _id: { type: "commandUsageTotal", command } },
                    update: { $inc: { count } },
                    upsert: true,
                },
            });
        });
        
        // Save all updates
        await this.collection.bulkWrite(bulkOps);
    }

    // safe to run per shard
    async saveUsersToday() {
        const today = this.getTodayDateString();
        const bulkOps = [];
        bulkOps.push({
            updateOne: {
                filter: { _id: { type: "uniqueUsers", date: today } },
                update: { 
                    $addToSet: { 
                        users: { $each: Array.from(this.usersToday) }
                    }
                },
            },
            upsert: true,
        });
        bulkOps.push({
            updateOne: {
                filter: { _id: { type: "uniqueUsersTotal" } },
                update: { $addToSet: { users: { $each: Array.from(this.usersToday) } } },
                upsert: true,
            },
        });
        await this.collection.bulkWrite(bulkOps);
        this.usersToday.clear();
    }

    async resetCommandUsage() {
        this.commandUsage = {};
        this.slashCommandCount = 0;
        this.textCommandCount = 0;
    }
}

module.exports = AnalyticsManager;
