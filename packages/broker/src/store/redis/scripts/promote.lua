local jobId = ARGV[1]
local currentTimems = tonumber(ARGV[2])
local score = ARGV[3]

local wakeTime = redis.call('ZSCORE' , KEYS[1] , jobId)

if not wakeTime then 
    return 0
end

if tonumber(wakeTime) > currentTimems then
    return 0
end

redis.call('ZREM' , KEYS[1] , jobId)
redis.call('ZADD' , KEYS[2] , score , jobId)
return 1