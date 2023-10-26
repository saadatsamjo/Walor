// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract SavingsGroup {
    address public owner;

    struct Group {
        uint256 contributionAmount;
        uint256 contributionDuration;
        address[] members;
    }

    Group[] public savingsGroups;
    mapping(uint256 => mapping(address => uint256)) memberBalances;

    event Contribution(address indexed member, uint256 indexed groupId, uint256 amount);

    constructor() {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Only the owner can perform this action");
        _;
    }

    function createGroup(uint256 _contributionAmount, uint256 _contributionDuration) external onlyOwner {
        savingsGroups.push(Group(_contributionAmount, _contributionDuration, new address[](0)));
    }

    function joinGroup(uint256 groupId) external {
        require(groupId < savingsGroups.length, "Group does not exist");
        savingsGroups[groupId].members.push(msg.sender);
    }

    function contribute(uint256 groupId) external payable {
        require(groupId < savingsGroups.length, "Group does not exist");
        Group storage group = savingsGroups[groupId];

        require(memberOfGroup(groupId, msg.sender), "You are not a member of this group");
        require(msg.value == group.contributionAmount, "Contribution amount does not match the group's requirement");

        uint256 memberIndex = getMemberIndex(groupId, msg.sender);

        require(memberIndex < group.members.length, "Member not found in the group");
        uint256 previousBalance = memberBalances[groupId][msg.sender];

        require(previousBalance + msg.value <= group.contributionAmount, "Contribution exceeds the group's limit");

        memberBalances[groupId][msg.sender] = previousBalance + msg.value;

        emit Contribution(msg.sender, groupId, msg.value);
    }

    function distributePayout(uint256 groupId) external onlyOwner {
        require(groupId < savingsGroups.length, "Group does not exist");
        Group storage group = savingsGroups[groupId];

        uint256 targetContributions = group.contributionAmount * group.members.length;

        for (uint256 i = 0; i < group.members.length; i++) {
            if (eligibleForPayout(groupId, group.members[i], targetContributions)) {
                payable(group.members[i]).transfer(group.contributionAmount);
            }
        }
    }

    function memberOfGroup(uint256 groupId, address member) internal view returns (bool) {
        return getMemberIndex(groupId, member) < savingsGroups[groupId].members.length;
    }

    function getMemberIndex(uint256 groupId, address member) internal view returns (uint256) {
        Group storage group = savingsGroups[groupId];
        for (uint256 i = 0; i < group.members.length; i++) {
            if (group.members[i] == member) {
                return i;
            }
        }
        return group.members.length;
    }

    function eligibleForPayout(uint256 groupId, address member, uint256 targetContributions) internal view returns (bool) {
        uint256 memberContributions = memberBalances[groupId][member];
        return (memberContributions >= (targetContributions * 9) / 10);
    }

    function getGroupCount() external view returns (uint256) {
        return savingsGroups.length;
    }
}
