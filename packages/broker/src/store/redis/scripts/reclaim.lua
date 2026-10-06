local jobId = ARGV[1]
local currentTime = tonumber(ARGV[2])
local leasePrefix = ARGV[3]
local score = ARGV[4]

local expiry = redis.call('ZSCORE' , KEYS[1] , jobId)

if expiry == false then
    return 0
end

if tonumber(expiry) <= currentTime then
    redis.call('ZREM' , KEYS[1] , jobId)
    redis.call('DEL' , leasePrefix .. jobId)
    if score ~= "" then
        redis.call('ZADD' , KEYS[2] , score , jobId)
    end
    return 1
end

return 0