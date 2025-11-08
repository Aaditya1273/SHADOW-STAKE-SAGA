module game::nft_items {
    use one::object::{Self, UID};
    use one::transfer;
    use one::tx_context::{Self, TxContext};
    use one::url::{Self, Url};
    use std::string::{Self, String};
    use one::event;

    // ==================== Errors ====================
    const ENotOwner: u64 = 0;

    // ==================== NFT Structs ====================
    
    /// Weapon NFT
    public struct Weapon has key, store {
        id: UID,
        name: String,
        weapon_type: String,
        damage: u64,
        rarity: String,
        image_url: Url,
        minted_at: u64,
        owner: address,
    }

    /// Armor NFT
    public struct Armor has key, store {
        id: UID,
        name: String,
        armor_type: String,
        defense: u64,
        rarity: String,
        image_url: Url,
        minted_at: u64,
        owner: address,
    }

    /// Relic NFT (rare collectibles)
    public struct Relic has key, store {
        id: UID,
        name: String,
        description: String,
        power: u64,
        rarity: String,
        image_url: Url,
        minted_at: u64,
        owner: address,
    }

    /// Boss Trophy NFT
    public struct BossTrophy has key, store {
        id: UID,
        boss_name: String,
        defeated_at: u64,
        difficulty: u64,
        image_url: Url,
        owner: address,
    }

    // ==================== Events ====================
    
    public struct WeaponMinted has copy, drop {
        weapon_id: address,
        owner: address,
        name: String,
        rarity: String,
    }

    public struct ArmorMinted has copy, drop {
        armor_id: address,
        owner: address,
        name: String,
        rarity: String,
    }

    public struct RelicMinted has copy, drop {
        relic_id: address,
        owner: address,
        name: String,
        rarity: String,
    }

    public struct BossTrophyMinted has copy, drop {
        trophy_id: address,
        owner: address,
        boss_name: String,
    }

    // ==================== Mint Functions ====================
    
    /// Mint a weapon NFT
    public fun mint_weapon(
        name: vector<u8>,
        weapon_type: vector<u8>,
        damage: u64,
        rarity: vector<u8>,
        image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let weapon = Weapon {
            id: object::new(ctx),
            name: string::utf8(name),
            weapon_type: string::utf8(weapon_type),
            damage,
            rarity: string::utf8(rarity),
            image_url: url::new_unsafe_from_bytes(image_url),
            minted_at: tx_context::epoch_timestamp_ms(ctx),
            owner: tx_context::sender(ctx),
        };

        let weapon_id = object::uid_to_address(&weapon.id);

        event::emit(WeaponMinted {
            weapon_id,
            owner: tx_context::sender(ctx),
            name: weapon.name,
            rarity: weapon.rarity,
        });

        transfer::transfer(weapon, tx_context::sender(ctx));
    }

    /// Mint an armor NFT
    public fun mint_armor(
        name: vector<u8>,
        armor_type: vector<u8>,
        defense: u64,
        rarity: vector<u8>,
        image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let armor = Armor {
            id: object::new(ctx),
            name: string::utf8(name),
            armor_type: string::utf8(armor_type),
            defense,
            rarity: string::utf8(rarity),
            image_url: url::new_unsafe_from_bytes(image_url),
            minted_at: tx_context::epoch_timestamp_ms(ctx),
            owner: tx_context::sender(ctx),
        };

        let armor_id = object::uid_to_address(&armor.id);

        event::emit(ArmorMinted {
            armor_id,
            owner: tx_context::sender(ctx),
            name: armor.name,
            rarity: armor.rarity,
        });

        transfer::transfer(armor, tx_context::sender(ctx));
    }

    /// Mint a relic NFT
    public fun mint_relic(
        name: vector<u8>,
        description: vector<u8>,
        power: u64,
        rarity: vector<u8>,
        image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let relic = Relic {
            id: object::new(ctx),
            name: string::utf8(name),
            description: string::utf8(description),
            power,
            rarity: string::utf8(rarity),
            image_url: url::new_unsafe_from_bytes(image_url),
            minted_at: tx_context::epoch_timestamp_ms(ctx),
            owner: tx_context::sender(ctx),
        };

        let relic_id = object::uid_to_address(&relic.id);

        event::emit(RelicMinted {
            relic_id,
            owner: tx_context::sender(ctx),
            name: relic.name,
            rarity: relic.rarity,
        });

        transfer::transfer(relic, tx_context::sender(ctx));
    }

    /// Mint a boss trophy NFT
    public fun mint_boss_trophy(
        boss_name: vector<u8>,
        difficulty: u64,
        image_url: vector<u8>,
        ctx: &mut TxContext
    ) {
        let trophy = BossTrophy {
            id: object::new(ctx),
            boss_name: string::utf8(boss_name),
            defeated_at: tx_context::epoch_timestamp_ms(ctx),
            difficulty,
            image_url: url::new_unsafe_from_bytes(image_url),
            owner: tx_context::sender(ctx),
        };

        let trophy_id = object::uid_to_address(&trophy.id);

        event::emit(BossTrophyMinted {
            trophy_id,
            owner: tx_context::sender(ctx),
            boss_name: trophy.boss_name,
        });

        transfer::transfer(trophy, tx_context::sender(ctx));
    }

    // ==================== Transfer Functions ====================
    
    /// Transfer weapon
    public fun transfer_weapon(
        weapon: Weapon,
        recipient: address,
        ctx: &TxContext
    ) {
        assert!(weapon.owner == tx_context::sender(ctx), ENotOwner);
        transfer::transfer(weapon, recipient);
    }

    /// Transfer armor
    public fun transfer_armor(
        armor: Armor,
        recipient: address,
        ctx: &TxContext
    ) {
        assert!(armor.owner == tx_context::sender(ctx), ENotOwner);
        transfer::transfer(armor, recipient);
    }

    /// Transfer relic
    public fun transfer_relic(
        relic: Relic,
        recipient: address,
        ctx: &TxContext
    ) {
        assert!(relic.owner == tx_context::sender(ctx), ENotOwner);
        transfer::transfer(relic, recipient);
    }

    // ==================== View Functions ====================
    
    /// Get weapon stats
    public fun get_weapon_stats(weapon: &Weapon): (String, String, u64, String) {
        (weapon.name, weapon.weapon_type, weapon.damage, weapon.rarity)
    }

    /// Get armor stats
    public fun get_armor_stats(armor: &Armor): (String, String, u64, String) {
        (armor.name, armor.armor_type, armor.defense, armor.rarity)
    }

    /// Get relic stats
    public fun get_relic_stats(relic: &Relic): (String, String, u64, String) {
        (relic.name, relic.description, relic.power, relic.rarity)
    }
}
