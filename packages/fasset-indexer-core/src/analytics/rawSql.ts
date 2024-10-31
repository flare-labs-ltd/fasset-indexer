export const COLLATERAL_POOL_PORTFOLIO_SQL = `
with cpt as (
    select collateral_pool_token_id
    from agent_vault
)

select
    a.hex as address,
    tb.token_id as token,
    cpt_a.hex as cpt_address,
    amount as balance
from token_balance as tb
left join evm_address as a on tb.holder_id = a.id
left join evm_address as cpt_a on token_id = cpt_a.id
where token_id in (select * from cpt)
and a.hex = ?
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