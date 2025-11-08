module game::shadow_stake_saga_game {
    use one::object::{Self, UID};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::coin::{Self, Coin};
    use one::oct::OCT;
    use one::event;
    use one::table::{Self, Table};

    // ==================== Errors ====================
    const ENotOwner: u64 = 0;
    const EInvalidScore: u64 = 1;
    const EGameNotActive: u64 = 2;
    const EInsufficientPayment: u64 = 3;

    // ==================== Structs ====================
    
    /// Player profile stored on-chain
    public struct PlayerProfile has key, store {
        id: UID,
        player: address,
        total_score: u64,
        games_played: u64,
        highest_score: u64,
        total_earned: u64,
        level: u64,
        created_at: u64,
    }

    /// Game session
    public struct GameSession has key {
        id: UID,
        player: address,
        score: u64,
        level: u64,
        enemies_killed: u64,
        items_collected: u64,
        start_time: u64,
        is_active: bool,
    }

    /// Game registry to track all players
    public struct GameRegistry has key {
        id: UID,
        total_players: u64,
        total_games: u64,
        leaderboard: Table<address, u64>, // address -> highest score
    }

    /// NFT Achievement
    public struct Achievement has key, store {
        id: UID,
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        earned_at: u64,
        player: address,
    }

    // ==================== Events ====================
    
    public struct GameStarted has copy, drop {
        player: address,
        session_id: address,
        timestamp: u64,
    }

    public struct GameCompleted has copy, drop {
        player: address,
        score: u64,
        level: u64,
        enemies_killed: u64,
        timestamp: u64,
    }

    public struct AchievementEarned has copy, drop {
        player: address,
        achievement_name: vector<u8>,
        timestamp: u64,
    }

    public struct ProfileCreated has copy, drop {
        player: address,
        timestamp: u64,
    }

    // ==================== Init ====================
    
    fun init(ctx: &mut TxContext) {
        let registry = GameRegistry {
            id: object::new(ctx),
            total_players: 0,
            total_games: 0,
            leaderboard: table::new(ctx),
        };
        
        transfer::share_object(registry);
    }

    // ==================== Player Profile Functions ====================
    
    /// Create a new player profile
    public fun create_profile(ctx: &mut TxContext) {
        let profile = PlayerProfile {
            id: object::new(ctx),
            player: tx_context::sender(ctx),
            total_score: 0,
            games_played: 0,
            highest_score: 0,
            total_earned: 0,
            level: 1,
            created_at: tx_context::epoch_timestamp_ms(ctx),
        };

        event::emit(ProfileCreated {
            player: tx_context::sender(ctx),
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        transfer::transfer(profile, tx_context::sender(ctx));
    }

    /// Get player stats
    public fun get_player_stats(profile: &PlayerProfile): (u64, u64, u64, u64) {
        (profile.total_score, profile.games_played, profile.highest_score, profile.level)
    }

    // ==================== Game Session Functions ====================
    
    /// Start a new game session
    public fun start_game(
        registry: &mut GameRegistry,
        ctx: &mut TxContext
    ) {
        let session = GameSession {
            id: object::new(ctx),
            player: tx_context::sender(ctx),
            score: 0,
            level: 1,
            enemies_killed: 0,
            items_collected: 0,
            start_time: tx_context::epoch_timestamp_ms(ctx),
            is_active: true,
        };

        let session_addr = object::uid_to_address(&session.id);

        registry.total_games = registry.total_games + 1;

        event::emit(GameStarted {
            player: tx_context::sender(ctx),
            session_id: session_addr,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        transfer::share_object(session);
    }

    /// Update game session during play
    public fun update_session(
        session: &mut GameSession,
        score: u64,
        level: u64,
        enemies_killed: u64,
        items_collected: u64,
        ctx: &TxContext
    ) {
        assert!(session.player == tx_context::sender(ctx), ENotOwner);
        assert!(session.is_active, EGameNotActive);

        session.score = score;
        session.level = level;
        session.enemies_killed = enemies_killed;
        session.items_collected = items_collected;
    }

    /// Complete game and update profile
    public fun complete_game(
        profile: &mut PlayerProfile,
        registry: &mut GameRegistry,
        session: &mut GameSession,
        ctx: &TxContext
    ) {
        assert!(session.player == tx_context::sender(ctx), ENotOwner);
        assert!(session.is_active, EGameNotActive);

        // Update profile
        profile.total_score = profile.total_score + session.score;
        profile.games_played = profile.games_played + 1;

        if (session.score > profile.highest_score) {
            profile.highest_score = session.score;
            
            // Update leaderboard
            if (table::contains(&registry.leaderboard, session.player)) {
                table::remove(&mut registry.leaderboard, session.player);
            };
            table::add(&mut registry.leaderboard, session.player, session.score);
        };

        // Level up logic
        if (profile.total_score > profile.level * 1000) {
            profile.level = profile.level + 1;
        };

        session.is_active = false;

        event::emit(GameCompleted {
            player: session.player,
            score: session.score,
            level: session.level,
            enemies_killed: session.enemies_killed,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });
    }

    // ==================== Achievement Functions ====================
    
    /// Mint achievement NFT
    public fun mint_achievement(
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let achievement = Achievement {
            id: object::new(ctx),
            name,
            description,
            image_url,
            earned_at: tx_context::epoch_timestamp_ms(ctx),
            player: tx_context::sender(ctx),
        };

        event::emit(AchievementEarned {
            player: tx_context::sender(ctx),
            achievement_name: name,
            timestamp: tx_context::epoch_timestamp_ms(ctx),
        });

        transfer::transfer(achievement, tx_context::sender(ctx));
    }

    // ==================== Payment Functions ====================
    
    /// Pay for premium features with OCT
    public fun pay_for_premium(
        payment: Coin<OCT>,
        recipient: address,
        ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        assert!(amount >= 1000000000, EInsufficientPayment); // 1 OCT minimum

        transfer::public_transfer(payment, recipient);
    }

    // ==================== Simple Score Storage (for frontend) ====================
    
    /// Simple score storage for game over
    public fun store_score(
        _game_id: vector<u8>,
        score: u64,
        rounds: u64,
        _timestamp: u64,
        _ctx: &TxContext
    ) {
        // Emit event for score storage
        event::emit(GameCompleted {
            player: tx_context::sender(_ctx),
            score: score,
            level: rounds,
            enemies_killed: 0,
            timestamp: _timestamp,
        });
    }

    // ==================== View Functions ====================
    
    /// Get game session info
    public fun get_session_info(session: &GameSession): (address, u64, u64, u64, bool) {
        (session.player, session.score, session.level, session.enemies_killed, session.is_active)
    }

    /// Get registry stats
    public fun get_registry_stats(registry: &GameRegistry): (u64, u64) {
        (registry.total_players, registry.total_games)
    }

    // ==================== Test Functions ====================
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
