module game::sss_token {
    use one::coin::{Self, Coin, TreasuryCap};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::url;
    use std::option;

    // ==================== Errors ====================
    const ENotAuthorized: u64 = 0;
    const EInsufficientBalance: u64 = 1;

    // ==================== Token Struct ====================
    
    /// One-time witness for the SSS token
    public struct SSS_TOKEN has drop {}

    // ==================== Init ====================
    
    /// Initialize the SSS token
    fun init(witness: SSS_TOKEN, ctx: &mut TxContext) {
        let (treasury, metadata) = coin::create_currency(
            witness,
            9, // 9 decimals
            b"SSS",
            b"Shadow Stake Saga",
            b"Earn SSS tokens by playing Shadow Stake Saga - the ultimate blockchain dungeon crawler",
            option::some(url::new_unsafe_from_bytes(b"https://shadowstakesaga.game/sss-logo.png")),
            ctx
        );

        // Freeze metadata so it cannot be changed
        transfer::public_freeze_object(metadata);
        
        // Transfer treasury cap to the deployer
        transfer::public_transfer(treasury, tx_context::sender(ctx));
    }

    // ==================== Mint Functions ====================
    
    /// Mint new SSS tokens (only treasury owner can call)
    public fun mint(
        treasury: &mut TreasuryCap<SSS_TOKEN>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let coin = coin::mint(treasury, amount, ctx);
        transfer::public_transfer(coin, recipient);
    }

    /// Mint and keep (returns the coin)
    public fun mint_and_keep(
        treasury: &mut TreasuryCap<SSS_TOKEN>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SSS_TOKEN> {
        coin::mint(treasury, amount, ctx)
    }

    // ==================== Burn Functions ====================
    
    /// Burn SSS tokens
    public fun burn(
        treasury: &mut TreasuryCap<SSS_TOKEN>,
        coin: Coin<SSS_TOKEN>
    ): u64 {
        coin::burn(treasury, coin)
    }

    // ==================== Transfer Functions ====================
    
    /// Transfer SSS tokens
    public fun transfer(
        coin: Coin<SSS_TOKEN>,
        recipient: address,
    ) {
        transfer::public_transfer(coin, recipient);
    }

    /// Split coin into two
    public fun split(
        coin: &mut Coin<SSS_TOKEN>,
        amount: u64,
        ctx: &mut TxContext
    ): Coin<SSS_TOKEN> {
        coin::split(coin, amount, ctx)
    }

    /// Join two coins
    public fun join(
        coin1: &mut Coin<SSS_TOKEN>,
        coin2: Coin<SSS_TOKEN>
    ) {
        coin::join(coin1, coin2);
    }

    // ==================== View Functions ====================
    
    /// Get coin value
    public fun value(coin: &Coin<SSS_TOKEN>): u64 {
        coin::value(coin)
    }

    /// Get total supply
    public fun total_supply(treasury: &TreasuryCap<SSS_TOKEN>): u64 {
        coin::total_supply(treasury)
    }

    // ==================== Test Functions ====================
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(SSS_TOKEN {}, ctx);
    }
}
