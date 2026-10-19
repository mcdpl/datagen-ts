// Gerado por scripts/generate-block-entities.ts
// Fonte: SpyglassMC/vanilla-mcdoc (b6df528ff97017da5b665a6a303a37e1682c6f7e)
// Alvo: Minecraft Java 26.3
// Não edite manualmente.

import type { NbtValue } from "../utils/holder/Block";

export type BlockEntitySlottedItem<T = number> = NbtValue & { Slot?: T };

export type BlockEntityBase = { id?: string; x?: number; y?: number; z?: number; keepPacked?: boolean; components?: NbtValue; };

export type BlockEntityBanner = { patterns?: BlockEntityBannerPatternLayer[]; } & BlockEntityBase & BlockEntityNameable;

export type BlockEntityBannerPatternLayer = { color: "white" | "orange" | "magenta" | "light_blue" | "yellow" | "lime" | "pink" | "gray" | "light_gray" | "cyan" | "purple" | "blue" | "brown" | "green" | "red" | "black"; pattern: string | NbtValue; };

export type BlockEntityBannerPatternType = "bs" | "ts" | "ls" | "rs" | "cs" | "ms" | "drs" | "dls" | "ss" | "cr" | "sc" | "ld" | "rud" | "lud" | "rd" | "vh" | "vhr" | "hh" | "hhb" | "bl" | "br" | "tl" | "tr" | "bt" | "tt" | "bts" | "tts" | "mc" | "mr" | "bo" | "cbo" | "bri" | "gra" | "gru" | "cre" | "sku" | "flo" | "moj" | "glb" | "pig";

export type BlockEntityBaseCommandBlock = { Command?: string; SuccessCount?: number; LastOutput?: NbtValue; TrackOutput?: boolean; UpdateLastExecution?: boolean; LastExecution?: number; };

export type BlockEntityBeacon = { Levels?: number; primary_effect?: string; secondary_effect?: string; } & BlockEntityBase & BlockEntityNameable & BlockEntityLockable;

export type BlockEntityBee = { min_ticks_in_hive: number; ticks_in_hive: number; entity_data: NbtValue; };

export type BlockEntityBeehive = { flower_pos?: number[]; bees?: BlockEntityBee[]; } & BlockEntityBase;

export type BlockEntityBrewingStand = { Items?: BlockEntitySlottedItem<number>[]; BrewTime?: number; Fuel?: number; total_brew_time?: number; total_fuel?: number; speed_multiplier?: number; } & BlockEntityBase & BlockEntityNameable & BlockEntityLockable;

export type BlockEntityBrushableBlock = { LootTable?: string; LootTableSeed?: number; item?: NbtValue; hit_direction?: number; } & BlockEntityBase;

export type BlockEntityCampfire = { Items?: BlockEntitySlottedItem<number>[]; CookingTimes?: number[]; CookingTotalTimes?: number[]; } & BlockEntityBase;

export type BlockEntityChargeCursor = { pos: number[]; charge?: number; decay_delay?: number; update_delay?: number; facings?: ("down" | "up" | "north" | "south" | "west" | "east")[]; };

export type BlockEntityChiseledBookshelf = { Items?: BlockEntitySlottedItem<number>[]; last_interacted_slot?: number; } & BlockEntityBase;

export type BlockEntityCommandBlock = { powered?: boolean; auto?: boolean; conditionMet?: boolean; } & BlockEntityBase & BlockEntityNameable & BlockEntityBaseCommandBlock;

export type BlockEntityComparator = { OutputSignal?: number; } & BlockEntityBase;

export type BlockEntityConduit = { Target?: number[]; } & BlockEntityBase;

export type BlockEntityConfig = { key_item?: NbtValue; loot_table?: string; override_loot_table_to_display?: string; activation_range?: number; deactivation_range?: number; };

export type BlockEntityContainer27 = { Items?: BlockEntitySlottedItem<number>[]; } & BlockEntityContainerBase;

export type BlockEntityContainer9 = { Items?: BlockEntitySlottedItem<number>[]; } & BlockEntityContainerBase;

export type BlockEntityContainerBase = { LootTable?: string; LootTableSeed?: number; } & BlockEntityBase & BlockEntityNameable & BlockEntityLockable;

export type BlockEntityCrafter = { crafting_ticks_remaining?: number; disabled_slots?: number[]; triggered?: 0 | 1; } & BlockEntityContainer9;

export type BlockEntityCreakingHeart = { creaking?: number[]; } & BlockEntityBase;

export type BlockEntityCustomSpawnRules = { block_light_limit?: { min?: number; max?: number }; sky_light_limit?: { min?: number; max?: number }; };

export type BlockEntityDecoratedPot = { LootTable?: string; LootTableSeed?: number; item?: NbtValue; } & BlockEntityBase & { sherds?: NbtValue; };

export type BlockEntityEnchantingTable = BlockEntityBase & BlockEntityNameable;

export type BlockEntityEndGateway = { Age?: number; ExactTeleport?: boolean; exit_portal?: number[]; } & BlockEntityBase;

export type BlockEntityErrorMarker = { pos: number[]; text: NbtValue; };

export type BlockEntityExitPortal = { X?: number; Y?: number; Z?: number; };

export type BlockEntityFlowerPos = { X?: number; Y?: number; Z?: number; };

export type BlockEntityFurnace = { Items?: BlockEntitySlottedItem<number>[]; RecipesUsed?: BlockEntityRecipesUsed; } & BlockEntityBase & BlockEntityNameable & BlockEntityLockable & { cooking_total_time?: number; cooking_time_spent?: number; lit_time_remaining?: number; lit_total_time?: number; speed_multiplier?: number; };

export type BlockEntityHopper = { Items?: BlockEntitySlottedItem<number>[]; TransferCooldown?: number; } & BlockEntityContainerBase;

export type BlockEntityJigsaw = { joint?: BlockEntityJointType; pool?: string; name?: string; target?: string; final_state?: string; };

export type BlockEntityJointType = "rollable" | "aligned";

export type BlockEntityJukebox = { RecordItem?: NbtValue; ticks_since_song_started?: number; } & BlockEntityBase;

export type BlockEntityLectern = { Book?: NbtValue; Page?: number; } & BlockEntityBase;

export type BlockEntityLegacyBee = { MinOccupationTicks?: number; TicksInHive?: number; EntityData?: NbtValue; };

export type BlockEntityLockable = { lock?: NbtValue; };

export type BlockEntityMirror = "NONE" | "LEFT_RIGHT" | "FRONT_BACK";

export type BlockEntityMode = "SAVE" | "LOAD" | "DATA" | "CORNER";

export type BlockEntityMovingPiston = { blockState?: string; facing?: number; progress?: number; extending?: boolean; source?: boolean; } & BlockEntityBase;

export type BlockEntityNameable = { CustomName?: NbtValue; };

export type BlockEntityNoneId = -1;

export type BlockEntityOldSign = { Color?: "white" | "orange" | "magenta" | "light_blue" | "yellow" | "lime" | "pink" | "gray" | "light_gray" | "cyan" | "purple" | "blue" | "brown" | "green" | "red" | "black"; GlowingText?: boolean; Text1?: string; Text2?: string; Text3?: string; Text4?: string; } & BlockEntityBase;

export type BlockEntityPotentSulfur = { countdown?: number; } & BlockEntityBase;

export type BlockEntityProperties = { textures?: BlockEntityTexture[]; };

export type BlockEntityRecipesUsed = Record<string, number>;

export type BlockEntityRotation = "NONE" | "CLOCKWISE_90" | "CLOCKWISE_180" | "COUNTERCLOCKWISE_90";

export type BlockEntitySculkCatalyst = { cursors?: BlockEntityChargeCursor[]; } & BlockEntityBase;

export type BlockEntitySculkSensor = { last_vibration_frequency?: number; listener?: NbtValue; };

export type BlockEntitySculkShrieker = { warning_level?: number; listener?: NbtValue; };

export type BlockEntityServerData = { state_updating_resumes_at?: number; rewarded_players?: number[][]; items_to_eject?: NbtValue[]; total_ejections_needed?: number; };

export type BlockEntitySharedData = { display_item?: NbtValue; connected_players?: number[][]; connected_particles_range?: number; };

export type BlockEntityShelf = { Items?: BlockEntitySlottedItem<number>[]; align_items_to_bottom?: boolean; } & BlockEntityContainerBase;

export type BlockEntitySign = { back_text?: NbtValue; front_text?: NbtValue; is_waxed?: boolean; allow_op_features?: boolean; } & BlockEntityBase;

export type BlockEntitySkull = { ExtraType?: string; note_block_sound?: NbtValue; profile?: NbtValue; custom_name?: NbtValue; } & BlockEntityBase;

export type BlockEntitySkullOwner = { Id?: number[]; Name?: string; Properties?: BlockEntityProperties; };

export type BlockEntitySpawnEquipment = { loot_table: string; slot_drop_chances: number | Record<string, number>; };

export type BlockEntitySpawner = { SpawnPotentials?: BlockEntitySpawnPotential[]; SpawnData?: BlockEntitySpawnerEntry; SpawnCount?: number; SpawnRange?: number; Delay?: number; MinSpawnDelay?: number; MaxSpawnDelay?: number; MaxNearbyEntities?: number; RequiredPlayerRange?: number; } & BlockEntityBase;

export type BlockEntitySpawnerEntry = { entity: NbtValue; custom_spawn_rules?: BlockEntityCustomSpawnRules; equipment?: BlockEntitySpawnEquipment; };

export type BlockEntitySpawnPotential = NbtValue;

export type BlockEntityStructureBlock = { name?: string; author?: string; metadata?: string; posX?: number; posY?: number; posZ?: number; sizeX?: number; sizeY?: number; sizeZ?: number; rotation?: BlockEntityRotation; mirror?: BlockEntityMirror; mode?: BlockEntityMode; ignoreEntities?: boolean; showboundingbox?: boolean; powered?: boolean; showair?: boolean; strict?: boolean; integrity?: number; seed?: number; } & BlockEntityBase;

export type BlockEntityTargetUuid = { M?: number; L?: number; };

export type BlockEntityTestBlock = { mode?: BlockEntityTestBlockMode; message?: string; powered?: boolean; } & BlockEntityBase;

export type BlockEntityTestBlockMode = "start" | "log" | "fail" | "accept";

export type BlockEntityTestInstanceBlock = { data?: BlockEntityTestInstanceBlockData; errors?: BlockEntityErrorMarker[]; } & BlockEntityBase;

export type BlockEntityTestInstanceBlockData = { test?: string; size: number[]; rotation: string; ignore_entities: boolean; status: BlockEntityTestInstanceBlockStatus; error_message?: NbtValue; };

export type BlockEntityTestInstanceBlockStatus = "cleared" | "running" | "finished";

export type BlockEntityTexture = { Signature?: string; Value?: string; };

export type BlockEntityTrialSpawner = { normal_config?: NbtValue | string; ominous_config?: NbtValue | string; required_player_range?: number; target_cooldown_length?: number; registered_players?: number[][]; current_mobs?: number[][]; cooldown_ends_at?: number; next_mob_spawns_at?: number; total_mobs_spawned?: number; spawn_data?: BlockEntitySpawnerEntry; ejecting_loot_table?: string; };

export type BlockEntityVault = { server_data?: BlockEntityServerData; config?: BlockEntityConfig; shared_data?: BlockEntitySharedData; };

export type BlockEntityDataByBlock = {
    [key: string]: {};
    acacia_hanging_sign: BlockEntitySign;
    acacia_shelf: BlockEntityShelf;
    acacia_sign: BlockEntitySign;
    acacia_wall_hanging_sign: BlockEntitySign;
    acacia_wall_sign: BlockEntitySign;
    bamboo_hanging_sign: BlockEntitySign;
    bamboo_shelf: BlockEntityShelf;
    bamboo_sign: BlockEntitySign;
    bamboo_wall_hanging_sign: BlockEntitySign;
    bamboo_wall_sign: BlockEntitySign;
    barrel: BlockEntityContainer27;
    beacon: BlockEntityBeacon;
    bee_nest: BlockEntityBeehive;
    beehive: BlockEntityBeehive;
    bell: BlockEntityBase;
    birch_hanging_sign: BlockEntitySign;
    birch_shelf: BlockEntityShelf;
    birch_sign: BlockEntitySign;
    birch_wall_hanging_sign: BlockEntitySign;
    birch_wall_sign: BlockEntitySign;
    black_banner: BlockEntityBanner;
    black_shulker_box: BlockEntityContainer27;
    black_wall_banner: BlockEntityBanner;
    blast_furnace: BlockEntityFurnace;
    blue_banner: BlockEntityBanner;
    blue_shulker_box: BlockEntityContainer27;
    blue_wall_banner: BlockEntityBanner;
    brewing_stand: BlockEntityBrewingStand;
    brown_banner: BlockEntityBanner;
    brown_shulker_box: BlockEntityContainer27;
    brown_wall_banner: BlockEntityBanner;
    calibrated_sculk_sensor: BlockEntityBase & BlockEntitySculkSensor;
    campfire: BlockEntityCampfire;
    chain_command_block: BlockEntityCommandBlock;
    cherry_hanging_sign: BlockEntitySign;
    cherry_shelf: BlockEntityShelf;
    cherry_sign: BlockEntitySign;
    cherry_wall_hanging_sign: BlockEntitySign;
    cherry_wall_sign: BlockEntitySign;
    chest: BlockEntityContainer27;
    chiseled_bookshelf: BlockEntityChiseledBookshelf;
    command_block: BlockEntityCommandBlock;
    comparator: BlockEntityComparator;
    conduit: BlockEntityConduit;
    copper_chest: BlockEntityContainer27;
    copper_golem_statue: BlockEntityBase;
    crafter: BlockEntityCrafter;
    creeper_head: BlockEntitySkull;
    creeper_wall_head: BlockEntitySkull;
    crimson_hanging_sign: BlockEntitySign;
    crimson_shelf: BlockEntityShelf;
    crimson_sign: BlockEntitySign;
    crimson_wall_hanging_sign: BlockEntitySign;
    crimson_wall_sign: BlockEntitySign;
    cyan_banner: BlockEntityBanner;
    cyan_shulker_box: BlockEntityContainer27;
    cyan_wall_banner: BlockEntityBanner;
    dark_oak_hanging_sign: BlockEntitySign;
    dark_oak_shelf: BlockEntityShelf;
    dark_oak_sign: BlockEntitySign;
    dark_oak_wall_hanging_sign: BlockEntitySign;
    dark_oak_wall_sign: BlockEntitySign;
    daylight_detector: BlockEntityBase;
    decorated_pot: BlockEntityDecoratedPot;
    dispenser: BlockEntityContainer9;
    dragon_head: BlockEntitySkull;
    dragon_wall_head: BlockEntitySkull;
    dropper: BlockEntityContainer9;
    enchanting_table: BlockEntityEnchantingTable;
    end_gateway: BlockEntityEndGateway;
    end_portal: BlockEntityBase;
    ender_chest: BlockEntityBase;
    exposed_copper_chest: BlockEntityContainer27;
    exposed_copper_golem_statue: BlockEntityBase;
    furnace: BlockEntityFurnace;
    gray_banner: BlockEntityBanner;
    gray_shulker_box: BlockEntityContainer27;
    gray_wall_banner: BlockEntityBanner;
    green_banner: BlockEntityBanner;
    green_shulker_box: BlockEntityContainer27;
    green_wall_banner: BlockEntityBanner;
    hopper: BlockEntityHopper;
    jigsaw: BlockEntityBase & BlockEntityJigsaw;
    jukebox: BlockEntityJukebox;
    jungle_hanging_sign: BlockEntitySign;
    jungle_shelf: BlockEntityShelf;
    jungle_sign: BlockEntitySign;
    jungle_wall_hanging_sign: BlockEntitySign;
    jungle_wall_sign: BlockEntitySign;
    lectern: BlockEntityLectern;
    light_blue_banner: BlockEntityBanner;
    light_blue_shulker_box: BlockEntityContainer27;
    light_blue_wall_banner: BlockEntityBanner;
    light_gray_banner: BlockEntityBanner;
    light_gray_shulker_box: BlockEntityContainer27;
    light_gray_wall_banner: BlockEntityBanner;
    lime_banner: BlockEntityBanner;
    lime_shulker_box: BlockEntityContainer27;
    lime_wall_banner: BlockEntityBanner;
    magenta_banner: BlockEntityBanner;
    magenta_shulker_box: BlockEntityContainer27;
    magenta_wall_banner: BlockEntityBanner;
    mangrove_hanging_sign: BlockEntitySign;
    mangrove_shelf: BlockEntityShelf;
    mangrove_sign: BlockEntitySign;
    mangrove_wall_hanging_sign: BlockEntitySign;
    mangrove_wall_sign: BlockEntitySign;
    moving_piston: BlockEntityMovingPiston;
    oak_hanging_sign: BlockEntitySign;
    oak_shelf: BlockEntityShelf;
    oak_sign: BlockEntitySign;
    oak_wall_hanging_sign: BlockEntitySign;
    oak_wall_sign: BlockEntitySign;
    orange_banner: BlockEntityBanner;
    orange_shulker_box: BlockEntityContainer27;
    orange_wall_banner: BlockEntityBanner;
    oxidized_copper_chest: BlockEntityContainer27;
    oxidized_copper_golem_statue: BlockEntityBase;
    pale_oak_hanging_sign: BlockEntitySign;
    pale_oak_shelf: BlockEntityShelf;
    pale_oak_sign: BlockEntitySign;
    pale_oak_wall_hanging_sign: BlockEntitySign;
    pale_oak_wall_sign: BlockEntitySign;
    pink_banner: BlockEntityBanner;
    pink_shulker_box: BlockEntityContainer27;
    pink_wall_banner: BlockEntityBanner;
    player_head: BlockEntitySkull;
    player_wall_head: BlockEntitySkull;
    poplar_hanging_sign: BlockEntitySign;
    poplar_shelf: BlockEntityShelf;
    poplar_sign: BlockEntitySign;
    poplar_wall_hanging_sign: BlockEntitySign;
    poplar_wall_sign: BlockEntitySign;
    potent_sulfur: BlockEntityPotentSulfur;
    purple_banner: BlockEntityBanner;
    purple_shulker_box: BlockEntityContainer27;
    purple_wall_banner: BlockEntityBanner;
    red_banner: BlockEntityBanner;
    red_shulker_box: BlockEntityContainer27;
    red_wall_banner: BlockEntityBanner;
    repeating_command_block: BlockEntityCommandBlock;
    sculk_catalyst: BlockEntitySculkCatalyst;
    sculk_sensor: BlockEntityBase & BlockEntitySculkSensor;
    sculk_shrieker: BlockEntityBase & BlockEntitySculkShrieker;
    shulker_box: BlockEntityContainer27;
    skeleton_skull: BlockEntitySkull;
    skeleton_wall_skull: BlockEntitySkull;
    smoker: BlockEntityFurnace;
    soul_campfire: BlockEntityCampfire;
    spawner: BlockEntitySpawner;
    spruce_hanging_sign: BlockEntitySign;
    spruce_shelf: BlockEntityShelf;
    spruce_sign: BlockEntitySign;
    spruce_wall_hanging_sign: BlockEntitySign;
    spruce_wall_sign: BlockEntitySign;
    structure_block: BlockEntityStructureBlock;
    suspicious_gravel: BlockEntityBrushableBlock;
    suspicious_sand: BlockEntityBrushableBlock;
    test_block: BlockEntityTestBlock;
    test_instance_block: BlockEntityTestInstanceBlock;
    trapped_chest: BlockEntityContainer27;
    trial_spawner: BlockEntityBase & BlockEntityTrialSpawner;
    vault: BlockEntityBase & BlockEntityVault;
    warped_hanging_sign: BlockEntitySign;
    warped_shelf: BlockEntityShelf;
    warped_sign: BlockEntitySign;
    warped_wall_hanging_sign: BlockEntitySign;
    warped_wall_sign: BlockEntitySign;
    waxed_copper_chest: BlockEntityContainer27;
    waxed_copper_golem_statue: BlockEntityBase;
    waxed_exposed_copper_chest: BlockEntityContainer27;
    waxed_exposed_copper_golem_statue: BlockEntityBase;
    waxed_oxidized_copper_chest: BlockEntityContainer27;
    waxed_oxidized_copper_golem_statue: BlockEntityBase;
    waxed_weathered_copper_chest: BlockEntityContainer27;
    waxed_weathered_copper_golem_statue: BlockEntityBase;
    weathered_copper_chest: BlockEntityContainer27;
    weathered_copper_golem_statue: BlockEntityBase;
    white_banner: BlockEntityBanner;
    white_shulker_box: BlockEntityContainer27;
    white_wall_banner: BlockEntityBanner;
    wither_skeleton_skull: BlockEntitySkull;
    wither_skeleton_wall_skull: BlockEntitySkull;
    yellow_banner: BlockEntityBanner;
    yellow_shulker_box: BlockEntityContainer27;
    yellow_wall_banner: BlockEntityBanner;
    zombie_head: BlockEntitySkull;
    zombie_wall_head: BlockEntitySkull;
};
