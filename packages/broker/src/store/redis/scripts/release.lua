local leasePrefix = ARGV[1]
local jobId = ARGV[2]
local token = ARGV[3]

local leaseKey = leasePrefix .. jobId

local storedToken = redis.call('GET' , leaseKey)

if storedToken ~= token then
    return 0
end

redis.call('DEL' , leaseKey)
redis.call('ZREM' , KEYS[1] , jobId)
return 1