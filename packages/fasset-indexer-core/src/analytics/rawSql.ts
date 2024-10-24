export const COLLATERAL_POOL_PORTFOLIO_SQL = (user: string) =>  `
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
    where a.hex = ${user}
    group by a.hex, token, cpt_address
) as cpt_tokens
where balance != 0
`