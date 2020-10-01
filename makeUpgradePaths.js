const arrasClassTree = require('./arrasClassTree.js').json;

const skippedTierPaths = {};

function makePathsForNextTier(parentTankUpgrades, parentTankPath, parentTankTier) {
    const childUpgradePaths = {};

    // Warning for the future:
    // this might break if theres a non-tier-3 tank without any further upgrades
    // for example, a tank that upgrades from twin at level 30, but has no lvl 45 upgrades
    parentTankUpgrades.forEach((child, i) => {
        // tier 3 tanks (Fighter, Overlord, etc...)
        if (parentTankTier === 2) {
            childUpgradePaths[child] = parentTankPath.concat(i)
        }
        // tanks that skip tiers (Twin -> Dual) (Basic => Single)
        else if ((parentTankTier === 0 || parentTankTier === 1) && Array.isArray(child)) {
            // this messes up on Smasher since its a skipped tier tank that has further upgrades
            // single seems to work fine though for some reason
            child.forEach((tank, j) => {
                skippedTierPaths[tank] = parentTankPath.concat(i + j);
            })

            // Smasher is a skipped tier tank with upgrades so the previous loop won't work for it, hence this:
            // this will break if more tanks like smasher that skip tiers and have upgrades are added
            // if that happens, just duplicate this code for the new tank
            if (typeof child[0] !== "string" && !Array.isArray(child[0])) {
                skippedTierPaths.Smasher = [i]; // smasher
                const smasherUpgrades = child[0].Smasher;
                smasherUpgrades.forEach((tank, k) => {
                    skippedTierPaths[tank] = parentTankPath.concat(i).concat(k);
                })

                // residue from the first loop in this else if branch
                // the one that takes care of skipped tier tanks without
                delete skippedTierPaths['[object Object]'];
            }
        }
        // is in tier, doesnt skip
        else {
            const childName = Object.keys(child)
            childUpgradePaths[childName] = parentTankPath.concat(i);
        }
    })
    //console.log(oneSkippedTierPaths)
    return childUpgradePaths;
}

// Basic (only Tier 0) has empty array since you don't have to click anything to upgrade to it
const tier0UpgradePaths = {Basic: []};

// get tier 1 paths (Twin, Sniper, etc...)
const tier1UpgradePaths = makePathsForNextTier(arrasClassTree.Basic, [], 0);
let tier2UpgradePaths = {};
let tier3UpgradePaths = {};

// get tier 2 paths (Tri-Angle, Triple Shot, etc...)
const tier1TankNames = Object.keys(tier1UpgradePaths);
const tier1Paths = Object.values(tier1UpgradePaths);
tier1TankNames.forEach((tankName, i) => {
    tier2UpgradePaths = {...tier2UpgradePaths, ...makePathsForNextTier(arrasClassTree.Basic[i][tankName], tier1Paths[i], 1)}
})

// get tier 3 paths (Fighter, Penta Shot)
const tier2TankNames = Object.keys(tier2UpgradePaths);
const tier2Paths = Object.values(tier2UpgradePaths);
tier2TankNames.forEach((tankName, i) => {
    const tier1ParentIndex = tier2Paths[i][0];
    const tier1ParentName = tier1TankNames[tier1ParentIndex];
    const tier2ParentIndex = tier2Paths[i][1];
    const tier2ParentTank = arrasClassTree.Basic[tier1ParentIndex][tier1ParentName][tier2ParentIndex][tankName];

    tier3UpgradePaths = {...tier3UpgradePaths, ...makePathsForNextTier(tier2ParentTank, tier2Paths[i], 2)}    
})

// combine all tiers and skipped paths into one object
const allTanksUpgradePaths = {
    ...tier0UpgradePaths,
    ...tier1UpgradePaths,
    ...tier2UpgradePaths,
    ...tier3UpgradePaths,
    ...skippedTierPaths,
}

console.log(JSON.stringify(allTanksUpgradePaths))
