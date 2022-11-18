import {
	getMembershipData,
	getDestinyAccountsForBungieAccount,
	getCharacters,
} from '@dlb/dim/bungie-api/destiny2-api';
import { getDefinitions } from '@dlb/dim/destiny2/d2-definitions';
import { loadStoresData } from '@dlb/dim/inventory/d2-stores';
import { setAllDataLoaded } from '@dlb/redux/features/allDataLoaded/allDataLoadedSlice';
import { setArmor } from '@dlb/redux/features/armor/armorSlice';
import { setAvailableExoticArmor } from '@dlb/redux/features/availableExoticArmor/availableExoticArmorSlice';
import { setCharacters } from '@dlb/redux/features/characters/charactersSlice';
import { setSelectedCharacterClass } from '@dlb/redux/features/selectedCharacterClass/selectedCharacterClassSlice';
import { setSelectedExoticArmor } from '@dlb/redux/features/selectedExoticArmor/selectedExoticArmorSlice';
import {
	SelectedSubclassOptions,
	setSelectedSubclassOptions,
} from '@dlb/redux/features/selectedSubclassOptions/selectedSubclassOptionsSlice';
import { useAppDispatch } from '@dlb/redux/hooks';
import { extractArmor, extractCharacters } from '@dlb/services/data';
import { AvailableExoticArmorItem } from '@dlb/types/Armor';
import { ArmorSlotIdList } from '@dlb/types/ArmorSlot';
import {
	DestinyClassIdList,
	DestinyClassIdToDestinySubclasses,
} from '@dlb/types/DestinyClass';
import { DestinySubclassIdToDestinySubclass } from '@dlb/types/DestinySubclass';
import { DestinySuperAbilityIdToDestinySuperAbility } from '@dlb/types/DestinySuperAbility';
import { ElementIdToElement } from '@dlb/types/Element';
import {
	EDestinyClassId,
	EDestinySubclassId,
	EDestinySuperAbilityId,
} from '@dlb/types/IdEnums';
import { CheckCircleRounded } from '@mui/icons-material';
import { Box, styled, Checkbox, Card, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { useState, useEffect } from 'react';

const Container = styled(Card)(({ theme }) => ({
	color: theme.palette.secondary.main,
	padding: theme.spacing(3),
	position: 'fixed',
	left: '50%',
	top: '50%',
	transform: 'translate(-50%, -50%)',
}));

const Item = styled(Box)(({ theme }) => ({
	color: theme.palette.secondary.main,
	display: 'flex',
}));

const ItemName = styled(Box)(({ theme }) => ({
	color: theme.palette.secondary.main,
	display: 'flex',
	flexDirection: 'column',
	justifyContent: 'center',
	paddingLeft: theme.spacing(1),
}));

const LoadingSpinner = styled(CircularProgress)(({ theme }) => ({
	color: theme.palette.secondary.main,
	width: '24px !important', // `${theme.spacing(2.6)} !important`,
	height: '24px !important', // `${theme.spacing(2.6)} !important`
}));

const LoadingSpinnerContainer = styled(Box)(() => ({
	transform: `scale(0.8)`,
	width: '24px !important', // `${theme.spacing(2.6)} !important`,
	height: '24px !important', // `${theme.spacing(2.6)} !important`
}));

function Loading() {
	const [hasMembershipData, setHasMembershipData] = useState(false);
	const [hasPlatformData, setHasPlatformData] = useState(false);
	const [hasManifest, setHasManifest] = useState(false);
	const [hasRawCharacters, setHasRawCharacters] = useState(false);
	const [hasStores, setHasStores] = useState(false);
	const router = useRouter();

	const dispatch = useAppDispatch();

	useEffect(() => {
		(async () => {
			try {
				dispatch(setAllDataLoaded(false));
				// TODO can any of these requests be paralellized? Like a Promise.All or whatever?
				const membershipData = await getMembershipData();
				setHasMembershipData(true);
				console.log(
					'>>>>>>>>>>> [LOAD] membership <<<<<<<<<<<',
					membershipData
				);
				const platformData = await getDestinyAccountsForBungieAccount(
					membershipData.membershipId
				);
				const mostRecentPlatform = platformData.find(
					(platform) => platform.membershipId === membershipData.membershipId
				);
				setHasPlatformData(true);
				console.log('>>>>>>>>>>> [LOAD] platform <<<<<<<<<<<', membershipData);

				const manifest = await getDefinitions();
				console.log('>>>>>>>>>>> [LOAD] manifest <<<<<<<<<<<', manifest);
				setHasManifest(true);

				const rawCharacters = await getCharacters(mostRecentPlatform);
				console.log(
					'>>>>>>>>>>> [LOAD] raw characters <<<<<<<<<<<',
					rawCharacters
				);
				setHasRawCharacters(true);

				const stores = await loadStoresData(mostRecentPlatform);
				console.log('>>>>>>>>>>> [LOAD] stores <<<<<<<<<<<', stores);
				setHasStores(true);
				const [armor, availableExoticArmor] = extractArmor(stores);
				dispatch(setArmor({ ...armor }));
				dispatch(setAvailableExoticArmor({ ...availableExoticArmor }));
				console.log('>>>>>>>>>>> [LOAD] armor <<<<<<<<<<<', armor);
				console.log(
					'>>>>>>>>>>> [LOAD] availableExoticArmor <<<<<<<<<<<',
					availableExoticArmor
				);
				const characters = extractCharacters(stores);
				dispatch(setCharacters([...characters]));
				dispatch(setSelectedCharacterClass(characters[0].destinyClassId));
				console.log('>>>>>>>>>>> [LOAD] characters <<<<<<<<<<<', characters);

				const defaultSelectedExoticArmor: Record<
					EDestinyClassId,
					AvailableExoticArmorItem
				> = {
					[EDestinyClassId.Titan]: null,
					[EDestinyClassId.Hunter]: null,
					[EDestinyClassId.Warlock]: null,
				};
				const defaultSelectedSubclassOptions: Record<
					EDestinyClassId,
					SelectedSubclassOptions
				> = {
					[EDestinyClassId.Titan]: null,
					[EDestinyClassId.Hunter]: null,
					[EDestinyClassId.Warlock]: null,
				};
				DestinyClassIdList.forEach((destinyClassId) => {
					// const destinySubclassIds =
					// 	DestinyClassIdToDestinySubclasses.get(destinyClassId);

					// const { destinySuperAbilityIds } =
					// 	DestinySubclassIdToDestinySubclass.get(destinySubclassIds[0]);
					// defaultSelectedSubclassOptions[destinyClassId] = {
					// 	destinySubclassId: destinySubclassIds[0],
					// 	destinySuperAbilityId: destinySuperAbilityIds[0],
					// };
					const opts: {
						destinySubclassId: EDestinySubclassId;
						destinySuperAbilityId: EDestinySuperAbilityId;
						superAbilityName: string;
						elementName: string;
					}[] = [];

					const destinySubclassIds =
						DestinyClassIdToDestinySubclasses.get(destinyClassId);
					destinySubclassIds.forEach((destinySubclassId) => {
						const { destinySuperAbilityIds } =
							DestinySubclassIdToDestinySubclass.get(destinySubclassId);
						destinySuperAbilityIds.forEach((destinySuperAbilityId) => {
							const { name: superAbilityName, elementId } =
								DestinySuperAbilityIdToDestinySuperAbility.get(
									destinySuperAbilityId
								);
							const { name: elementName } = ElementIdToElement.get(elementId);
							opts.push({
								destinySubclassId,
								destinySuperAbilityId,
								superAbilityName,
								elementName,
							});
						});
					});
					const { destinySubclassId, destinySuperAbilityId } = opts.sort(
						(a, b) =>
							(a.elementName + a.superAbilityName).localeCompare(
								b.elementName + b.superAbilityName
							)
					)[0];
					defaultSelectedSubclassOptions[destinyClassId] = {
						destinySubclassId: destinySubclassId,
						destinySuperAbilityId: destinySuperAbilityId,
					};

					if (availableExoticArmor[destinyClassId]) {
						for (const armorSlotId of ArmorSlotIdList) {
							// TODO: this lookup of className in the availableExoticArmor const is not
							// typesafe and is not picked up by intellisense. remove all such mapping consts
							// availableExoticArmor['derp'] is not caught!!!!!
							if (
								availableExoticArmor[destinyClassId][armorSlotId].length > 0
							) {
								// Just pick the first exotic item we find
								defaultSelectedExoticArmor[destinyClassId] =
									availableExoticArmor[destinyClassId][armorSlotId][0];
								break;
							}
						}
					}
				});
				dispatch(setSelectedExoticArmor(defaultSelectedExoticArmor));
				dispatch(setSelectedSubclassOptions(defaultSelectedSubclassOptions));
				console.log(
					'>>>>>>>>>>> [LOAD] defaultSelectedExoticArmor <<<<<<<<<<<',
					defaultSelectedExoticArmor
				);
				dispatch(setAllDataLoaded(true));
			} catch (e) {
				// TODO redirect only on the right kind of error
				// Test by deleting 'authorization' from localStorage
				console.error(e);
				router.push('/login');
			}
		})();

		return () => {
			// this now gets called when the component unmounts
			// TODO: Clean up
		};
	}, [dispatch, router]);

	const items: [string, boolean][] = [
		['Bungie Membership Data', hasMembershipData],
		['Platform Data', hasPlatformData],
		['Destiny Manifest', hasManifest],
		['Your Characters', hasRawCharacters],
		['Your Inventory', hasStores],
	];

	return (
		<>
			<Container>
				{items.map(([name, loaded], i) => (
					<Item key={name}>
						{loaded ? (
							<CheckCircleRounded />
						) : (
							<LoadingSpinnerContainer>
								<LoadingSpinner />
							</LoadingSpinnerContainer>
						)}
						<ItemName>{name}</ItemName>
					</Item>
				))}
			</Container>
		</>
	);
}

export default Loading;
