import { DimItem, D2Item } from '../item-types';
import {
  DestinyInventoryItemDefinition,
  DestinyItemComponent,
  DestinyItemComponentSetOfint64,
  DestinyItemInstanceComponent,
  DamageType
} from 'bungie-api-ts/destiny2';
import { D2ManifestDefinitions } from '../../destiny2/d2-definitions.service';

// Map from mod item hash to info
const mods = {
  // Hellas Basin Resource Detector: Detect resources within a 30-meter range while in Hellas Basin.
  30834361: { location: 'mars' },
  // Improved Nessus Cache Detector: Detect caches within a 40-meter range while on Nessus.
  66383463: { location: 'nessus', improved: true },
  // Hellas Basin Scanner: Grants a chance to obtain additional faction consumables in Hellas Basin.
  183999083: { location: 'mars' },
  // Titan Resource Detector: Detect resources within a 30-meter range while on the moon Titan.
  263169843: { location: 'titan' },
  // Hellas Basin Glimmer Scavenger: Increase Glimmer gains by 10% in Hellas Basin.
  281656579: { location: 'mars' },
  // Crucible Experience Log: Gain 10% more XP while in the Crucible.
  329782251: { location: 'pvp' },
  // EDZ Combo Detector: Detect caches or resources within a 30-meter range while in the EDZ.
  390974608: { location: 'edz' },
  // Mercury Experience Log: Gain 10% more XP while on Mercury.
  566395092: { location: 'mercury' },
  // Io Resource Detector: Detect resources within a 30-meter range while on Io.
  707631447: { location: 'io' },
  // Crucible Kill Tracker: Allows your Ghost to track kills in the Crucible.
  727110355: { location: 'pvp' },
  // Seeker of Opulence: Exotic drops from encounters on the Leviathan have a 50% chance of being an Exotic not already in your collection.
  741416970: { location: 'raid' },
  // Titan Combo Detector: Detect caches or resources within a 30-meter range while on Titan.
  815624991: { location: 'titan' },
  // Hellas Basin Combo Detector: Detect caches or resources within a 30-meter range while in Hellas Basin.
  819844944: { location: 'mars' },
  // Titan Cache Detector: Detect caches within a 30-meter range while on Titan.
  932058162: { location: 'titan' },
  // Io Combo Detector: Detect caches or resources within a 30-meter range while on Io.
  1048118643: { location: 'io' },
  // Io Experience Log: Gain 10% more XP while on Io.
  1064347710: { location: 'io' },
  // Nessus Resource Detector: Detect resources within a 30-meter range while on Nessus.
  1085640235: { location: 'nessus' },
  // Mercury Combo Detector: Detect caches or resources within a 30-meter range while on Mercury.
  1255371660: { location: 'mercury' },
  // Crucible Scanner: Chance to obtain additional faction consumables in the Crucible.
  1329583752: { location: 'pvp' },
  // Titan Glimmer Scavenger: Increase Glimmer gains by 10% on the moon of Titan.
  1400394461: { location: 'titan' },
  // Improved Hellas Basin Cache Detector: Detect caches within a 40-meter range while in Hellas Basin.
  1586768444: { location: 'mars', improved: true },
  // Arc Weapon Analyzer: Generate Gunsmith telemetry data on Arc weapon kills.
  1626532497: { dmg: 2 },
  // Improved Io Cache Detector: Detect caches within a 40-meter range while on Io.
  1765741659: { location: 'io', improved: true },
  // Nessus Experience Log: Gain 10% more XP while on Nessus.
  1894263102: { location: 'nessus' },
  // Io Glimmer Scavenger: Increase Glimmer gains by 10% on Io.
  1916863581: { location: 'io' },
  // Titan Experience Log: Gain 10% more experience while on the moon Titan.
  1933479768: { location: 'titan' },
  // Solar Weapon Analyzer: Generate Gunsmith telemetry data on Solar weapon kills.
  1942048138: { dmg: 3 },
  // Titan Scanner: Chance to obtain additional faction consumables on the moon Titan.
  1946260457: { location: 'titan' },
  // EDZ Experience Log: Gain 10% more XP while in the EDZ.
  1990928495: { location: 'edz' },
  // Vanguard Scanner: Grants a chance to obtain additional faction consumables in strikes.
  1991567150: { location: 'strike' },
  // Mercury Glimmer Scavenger: Increase Glimmer gains by 10% on Mercury.
  2126415067: { location: 'mercury' },
  // Improved Mercury Cache Detector: Detect caches within a 40-meter range while on Mercury.
  2142971474: { location: 'mercury', improved: true },
  // Io Cache Detector: Detect caches within a 30-meter range while on Io.
  2199055252: { location: 'io' },
  // Strike Experience Log: Gain 10% more XP while in strikes.
  2207103371: { location: 'strike' },
  // Hellas Basin Cache Detector: Detect caches within a 30-meter range while in Hellas Basin.
  2224144604: { location: 'mars' },
  // Improved Titan Cache Detector: Detect caches within a 40-meter range while on Titan.
  2274579115: { location: 'titan', improved: true },
  // EDZ Glimmer Scavenger: Increase Glimmer gains by 10% in the EDZ.
  2425296638: { location: 'edz' },
  // Improved EDZ Cache Detector: Detect caches within a 40-meter range while in the EDZ.
  2645492862: { location: 'edz', improved: true },
  // Nessus Glimmer Scavenger: Increase Glimmer gains by 10% on Nessus.
  2856116177: { location: 'nessus' },
  // Mercury Scanner: Grants a chance to obtain additional faction consumables on Mercury.
  3138059283: { location: 'mercury' },
  // EDZ Scanner: Chance to obtain additional faction consumables in the EDZ.
  3147447938: { location: 'edz' },
  // Mercury Cache Detector: Detect caches within a 30-meter range while on Mercury.
  3260411014: { location: 'mercury' },
  // Strike Glimmer Scavenger: Increase Glimmer gains by 10% in Strikes.
  3300497782: { location: 'strike' },
  // Nessus Scanner: Chance to obtain additional faction consumables on Nessus.
  3393447213: { location: 'nessus' },
  // Improved Arc Analyzer: Generate Gunsmith telemetry data on Arc weapon kills.
  3447587684: { dmg: 2, improved: true },
  // Improved Void Analyzer: Generate Gunsmith telemetry data on Void weapon kills.
  3448093826: { dmg: 4, improved: true },
  // Nessus Cache Detector: Detect caches within a 30-meter range while on Nessus.
  3457795268: { location: 'nessus' },
  // EDZ Resource Detector: Detect resources within a 30-meter range while in the EDZ.
  3523930524: { location: 'edz' },
  // Nessus Combo Detector: Detect caches or resources within a 30-meter range while on Nessus.
  3569214087: { location: 'nessus' },
  // Seeker of Brilliance: In addition to their normal rewards, encounters on the Leviathan can award Bright Engrams. This chance increases each time no Bright Engram drops.
  3785828493: { location: 'raid' },
  // Improved Solar Analyzer: Generate Gunsmith telemetry data on Solar weapon kills.
  3883296839: { dmg: 3, improved: true },
  // Hellas Basin Experience Log: Gain 10% more XP while in Hellas Basin.
  3900721702: { location: 'mars' },
  // Crucible Glimmer Scavenger: Increase Glimmer gains by 10% in the Crucible.
  3935848740: { location: 'pvp' },
  // Io Scanner: Chance to obtain additional faction consumables on Io.
  4040200521: { location: 'io' },
  // EDZ Cache Detector: Detect caches within a 30-meter range while in the EDZ.
  4051388481: { location: 'edz' },
  // Mercury Resource Detector: Detect resources within a 30-meter range while on Mercury.
  4082217637: { location: 'mercury' },
  // Vanguard Kill Tracker: Allows your Ghost to track your kills against the City's enemies.
  4138317986: {},
  // Seeker of Glory: Tracks the number of encounters on the Leviathan you have cleared.
  4286985160: { location: 'raid' },
  // Void Weapon Analyzer: Generate Gunsmith telemetry data on Void weapon kills.
  4287983117: { dmg: 4 }
};

export function classifyGhost(
  createdItem: D2Item,
  itemDef: DestinyInventoryItemDefinition,
  itemComponents: DestinyItemComponentSetOfint64 | undefined,
  item: DestinyItemComponent,
  instanceDef: Partial<DestinyItemInstanceComponent>
) {

  //console.log({ createdItem, itemDef, itemComponents, item, instanceDef });

  let data = {};

  if (createdItem.sockets) {
    for (const socket of createdItem.sockets!.sockets) {
      const mod = mods[socket.plug!.plugItem.hash];
      if (mod) {
        data = { ...data, ...mod };
      }
    }
    //console.log(createdItem.name, data);
  }

  return data;
}

function generateModMap(defs: D2ManifestDefinitions) {
  let modsJson = '{';

  for (const def of Object.values(defs.allItems)) {
    // There are also intrinsic perks like Guiding Light, Public Defender, etc
    // Ghost Module - there's also Ghost Stat Tracker
    if (def.itemCategoryHashes && def.itemCategoryHashes.includes(1449602859)) {
      modsJson += `
  // ${def.displayProperties.name}: ${def.displayProperties.description}
  ${def.hash}: ${JSON.stringify(getProperties(def))},`;
      mods[def.hash] = {};
    }
  }

  console.log(modsJson + '\n}');
}

function getProperties(def: DestinyInventoryItemDefinition) {
  const props: any = {};
  const location = getLocation(def);
  if (location) {
    props.location = location;
  }
  const dmg = getDamage(def);
  if (dmg) {
    props.dmg = dmg;
  }
  const type = getType(def);
  if (type) {
    props.type = type;
  }
  if (def.displayProperties.name.includes('Improved')) {
    props.improved = true;
  }
  return props;
}

const locations = {
  'Hellas Basin': 'mars',
  EDZ: 'edz',
  Io: 'io',
  Titan: 'titan',
  Mercury: 'mercury',
  Nessus: 'nessus',
  Crucible: 'pvp',
  Seeker: 'raid',
  Strike: 'strike',
  'Vanguard Scanner': 'strike'
};

function getLocation(def: DestinyInventoryItemDefinition) {
  for (const location of Object.keys(locations)) {
    if (def.displayProperties.name.includes(location)) {
      return locations[location];
    }
  }
  return undefined;
}

const damage = {
  Solar: DamageType.Thermal,
  Void: DamageType.Void,
  Arc: DamageType.Arc
};

function getDamage(def: DestinyInventoryItemDefinition) {
  for (const dmg of Object.keys(damage)) {
    if (def.displayProperties.name.includes(dmg)) {
      return damage[dmg];
    }
  }
  return undefined;
}

const types = {
  'Resource Detector': 'detector',
  'Cache Detector': 'detector',
  'Combo Detector': 'detector',
  Analyzer: 'analyzer',
  Log: 'xp',
  Scanner: 'token',
  Scavenger: 'glimmer'
};

function getType(def: DestinyInventoryItemDefinition) {
  for (const dmg of Object.keys(types)) {
    if (def.displayProperties.name.includes(dmg)) {
      return damage[dmg];
    }
  }
  return undefined;
}
