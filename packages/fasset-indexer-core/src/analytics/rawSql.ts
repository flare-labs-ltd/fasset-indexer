export const COLLATERAL_POOL_PORTFOLIO_SQL = `
with cpt as (
    select collateral_pool_token_id
    from agent_vault
),

erc20txs as (
    select
        to_id as address_id,
        el.address_id as token,
        value
    from erc20transfer
    left join evm_log as el on evm_log_id = el.id
    where el.address_id in (select * from cpt)

    union all

    select
        from_id as address_id,
        el.address_id as token,
        - value
    from erc20transfer
    left join evm_log as el on evm_log_id = el.id
    where el.address_id in (select * from cpt)
)

select *
from (
    select
        a.hex as address,
        token,
        cpt_a.hex as cpt_address,
        sum(erc20txs.value) as balance
    from erc20txs
    left join evm_address as a on address_id = a.id
    left join evm_address as cpt_a on token = cpt_a.id
    where a.hex = ?
    group by a.hex, token, cpt_address
) as cpt_tokens
where balance != 0
`

export const BEST_COLLATERAL_POOLS = `
SELECT grouped.fasset, grouped.hex, grouped.fee_score
FROM (
    SELECT
        av.fasset,
        cpa.hex,
        avs.fee_bips * avs.pool_fee_share_bips AS fee_score
    FROM agent_vault av
    INNER JOIN evm_address cpa ON av.collateral_pool_id = cpa.id
    INNER JOIN agent_vault_info avi ON av.address_id = avi.agent_vault_address_id
    INNER JOIN agent_vault_settings avs ON av.address_id = avs.agent_vault_address_id
    WHERE avi.status = 0 AND avi.free_collateral_lots > ?
    GROUP BY av.fasset, cpa.hex, avs.fee_bips, avs.pool_fee_share_bips
) AS grouped
ORDER BY fee_score DESC
LIMIT ?
`