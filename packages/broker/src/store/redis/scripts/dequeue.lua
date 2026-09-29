local ttl = tonumber(ARGV[1])
local leasePrefix = ARGV[2]
local currentTime = tonumber(ARGV[3])
local typePrefix = ARGV[4]
local allowedTypesCount = tonumber(ARGV[5])

local allowedTypes = {}
for k = 1, allowedTypesCount do
    table.insert(allowedTypes, ARGV[5 + k])
end

local count = tonumber(ARGV[5 + allowedTypesCount + 1])
local expiryScore = currentTime + ttl
local results = {}

for i = 1, count do
    local popped = redis.call('ZPOPMIN', KEYS[1], 1)
    if #popped == 0 then
        break
    end

    local jobId = popped[1]
    local jobType = redis.call('GET', typePrefix .. jobId)

    local matched = false
    if allowedTypesCount == 0 then
        matched = true
    else
        for j = 1, #allowedTypes do
            if allowedTypes[j] == jobType then
                matched = true
                break
            end
        end
    end

    if matched then
        local token = ARGV[5 + allowedTypesCount + 1 + i]
        redis.call('SET', leasePrefix .. jobId, token, 'PX', ttl)
        redis.call('ZADD', KEYS[2], expiryScore, jobId)
        table.insert(results, popped)
    else
        redis.call('ZADD', KEYS[1], popped[2], jobId)
    end
end

return results