const { expect } = require("chai");

describe("SavingsGroup", function () {
  let SavingsGroup;
  let savingsGroup;
  let owner;
  let member1;
  let member2;

  // beforeEach(async function () {
  //   SavingsGroup = await ethers.getContractFactory("SavingsGroup");

  //   [owner, member1, member2] = await ethers.getSigners();
  //   // console.log(owner)
  //   savingsGroup = await SavingsGroup.deploy();
  //   await savingsGroup.deployed();
  // });

    beforeEach(async function () {
    SavingsGroup = await ethers.getContractFactory("SavingsGroup");

    [owner, member1, member2] = await ethers.getSigners();
    // console.log(owner)
    savingsGroup = await ethers.deployContract("SavingsGroup");

    // await savingsGroup.deployed();
  });
  

  it("Should allow the owner to create a group", async function () {
    var tests = await savingsGroup.createGroup(100, 3600); // Example values for contribution amount and duration
    console.log(tests)
    expect(await savingsGroup.getGroupCount()).to.equal(1);
  });

  it("Should allow members to join a group", async function () {
   // Create a group
   await savingsGroup.createGroup(100, 3600); // Example values for contribution amount and duration
   const groupId = (await savingsGroup.getGroupCount()) - BigInt(1);

   // Join the group
   await savingsGroup.joinGroup(groupId, { from: member1 });
   await savingsGroup.joinGroup(groupId, { from: member2 });

   // Get the group details
   const group = await savingsGroup.savingsGroups(groupId);

   // Assertions
   expect(group.members).to.have.lengthOf(2);
   expect(group.members[0]).to.equal(member1);
   expect(group.members[1]).to.equal(member2);
  });

  it("Should record contributions correctly", async function () {
    await savingsGroup.createGroup(100, 3600); // Example values for contribution amount and duration
    const groupId = (await savingsGroup.getGroupCount()) - 1;

    await savingsGroup.joinGroup(groupId, { from: member1.address });
    await savingsGroup.contribute(groupId, { from: member1.address, value: 50 });

    const balance = await savingsGroup.memberBalances(groupId, member1.address);
    expect(balance).to.equal(50);
  });

  it("Should distribute the payout to an eligible recipient", async function () {
    await savingsGroup.createGroup(100, 3600); // Example values for contribution amount and duration
    const groupId = (await savingsGroup.getGroupCount()) - 1;

    await savingsGroup.joinGroup(groupId, { from: member1.address });
    await savingsGroup.joinGroup(groupId, { from: member2.address });

    await savingsGroup.contribute(groupId, { from: member1.address, value: 90 });
    await savingsGroup.contribute(groupId, { from: member2.address, value: 100 });

    // Increase time by contribution duration to trigger payout
    await network.provider.send("evm_increaseTime", [3600]);
    await network.provider.send("evm_mine");

    const initialBalanceRecipient = await ethers.provider.getBalance(member2.address);

    await savingsGroup.distributePayout(groupId, { from: owner.address });

    const finalBalanceRecipient = await ethers.provider.getBalance(member2.address);

    expect(finalBalanceRecipient).to.be.gt(initialBalanceRecipient);
  });
});