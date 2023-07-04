import { MessageType } from "../scd"
import type { IEDElement, InputExtRefElement, SCDQueries } from "../scd/scd-query"

/** 
 * The name is temporary, rename it if you have a better one
 * UC = Use Case
 */
export class UCCommunicationInformation {

	constructor(
		private readonly scdQueries: SCDQueries,
	){}

	public IEDCommInfos(): IEDCommInfo[] {

		const ieds = this.scdQueries.searchIEDs()
		const commInfos: IEDCommInfo[] = ieds.map(ied => {
			return {
				iedName:   ied.name,
				// published: this.findPublishedMessages(ied),
				published: this.findPublishedMessages_V2(ied),
				received:  this.findReceivedMessages(ied),
			}
		})
		return commInfos
	}

	public IEDCommInfosByBay(): Map<string, IEDCommInfo[]> {
		const ieds = this.IEDCommInfos()

		const baysWithIEDs = new Map<string, IEDCommInfo[]>()
		ieds.forEach((ied) => {
			const bayNames = this.scdQueries.getBaysByIEDName(ied.iedName)
			
			bayNames.forEach((bayName) => {
				let setList: IEDCommInfo[] | undefined = []

				if (!baysWithIEDs.has(bayName)) 
					baysWithIEDs.set(bayName, [])

				setList = baysWithIEDs.get(bayName)
				setList?.push(ied)
			})
		})

		return baysWithIEDs
	}

	public IEDCommInfosByBus(): Map<string, IEDCommInfo[]> {
		const ieds = this.IEDCommInfos()

		const busesWithIEDs = new Map<string, IEDCommInfo[]>()
		ieds.forEach((ied) => {
			const busNames = this.scdQueries.getBusesByIEDName(ied.iedName)
			
			busNames.forEach((busName) => {
				let setList: IEDCommInfo[] | undefined = []

				if (!busesWithIEDs.has(busName)) 
					busesWithIEDs.set(busName, [])

				setList = busesWithIEDs.get(busName)
				setList?.push(ied)
			})
		})

		return busesWithIEDs
	}

	private findPublishedMessages_V2(ied: IEDElement): PublishedMessage_V2[]{
		const messages: PublishedMessage_V2[] = []
		
		const reportControlInfos = this.findPublishedReportControls(ied)
		for(const info of reportControlInfos){
			messages.push({
				id:            info.rptID,
				name:          info.name,
				targetIEDName: info.clientIEDName,
				serviceType:   MessageType.MMS,
			})
		}

		return messages
	}
	

	/**
	 *
	 * Note: we currenlty not using the result of this function
	 * because GOOSE and Sampled Measure Values are always are inside an input
	 * at the receiving IED and we use that to create the connections
	 * This leads to that, that we ignore published messages that nobody receives
	 * 
	 * The current version takes only GOOSE messages into consideration
	 * an therefore not compatible with Sampled Measured Values and MMS (ReportControls)
	 * So we deprecate this function and rewrite it in a more general way
	 *  
	 * @deprecated
	 * @param ied 
	 * @returns 
	 */
	// private findPublishedMessages(ied: IEDElement): PublishedMessage[] {
	// 	const published = []

	// 	const gseControls = this.scdQueries.searchGSEControls({ root: ied.element })

	// 	for (const gseControl of gseControls) {
	// 		const isGSEControlIrrelevant = gseControl.datSet === ""
	// 		if (isGSEControlIrrelevant) { continue} 

	// 		const message: Partial<PublishedMessage> = {}
	// 		message.gseControlName = gseControl.name
	// 		message.dataSetName = gseControl.datSet
	// 		const ldevice = this.scdQueries.searchElementsLDParent(gseControl.element)
	// 		if (!ldevice) {
	// 			console.warn({ level: "warning", msg: "could not find GSE Control's parent LD, continuing", gseControl, ied: ied.name })
	// 			continue
	// 		}
	// 		message.LDeviceInst = ldevice.inst

	// 		// Note: need it later whe we display information about the message
	// 		// const dataSets = this.scdQueries.searchDataSetByName(gseControl.datSet, {root:ied.element})
	// 		const gse = this.scdQueries.searchGSE(ldevice.inst, gseControl.name)
	// 		if (!gse) {
	// 			console.warn({
	// 				level:          "warning",
	// 				msg:            "could not find GSE, continuing ",
	// 				ldInst:         ldevice.inst,
	// 				gseControlName: gseControl.name,
	// 				ied:            ied.name,
	// 			})
	// 			continue
	// 		}
	// 		const subNetwork = this.scdQueries.searchElementsParentSubnetwork(gse.element)
	// 		if (!subNetwork) {
	// 			console.warn({ level: "warnin", msg: "could not find GSE's parent SubNetwork, continuing", gse })
	// 			continue
	// 		}
	// 		message.subNetworkName = subNetwork.name

	// 		published.push(message as PublishedMessage)
	// 	}

	// 	return published
	// }

	private findReceivedMessages(ied: IEDElement ): ReceivedMessage[] {
		const inputs = this.scdQueries.searchInputs({ root: ied.element })
		const extRefs = inputs.map(input => this.scdQueries.searchExtRef({ root: input.element })).flat()
		
		const messages = groupInputExtRefElementsByIedNameServiceTypeAndSrcCBName(extRefs)

		return messages
	}


	private findPublishedReportControls(ied: IEDElement): ReportControlInfo[] {
		const controls: ReportControlInfo[] = []
		const reportControls = this.scdQueries.searchReportControls({root: ied.element})
		for(const reportControl of reportControls){
			const clientLNs = this.scdQueries.searcClientLNs({root: reportControl.element })

			for(const clientLN of clientLNs){
				controls.push({
					clientIEDName: clientLN.iedName,
					rptID:         reportControl.rptID,
					name:          reportControl.name,
				})
			}
			
		}
		
		return controls
	}

}

export type MessageSourceMap = {[iedName: string]: ReceivedMessage[]}

export type ReportControlInfo = {
	clientIEDName: string
	rptID: string
	name: string
}

export type IEDCommInfo = {
	iedName: string
	published: PublishedMessage_V2[]
	received: ReceivedMessage[]
}

/**
 * @deprecated see `findPublishedMessages`
 */
export type PublishedMessage = {
	dataSetName: 	string
	gseControlName: string
	LDeviceInst: 	string
	subNetworkName: string
}

export type PublishedMessage_V2 = {
	id: string,
	name: string
	targetIEDName: string
	serviceType: string
}

export type ReceivedMessage = {
	iedName: 	 string // to show
	serviceType: string // to filter
	srcCBName: 	 string // to show
	data:        InputExtRefElement[] 
}


type TempKey = {iedName: string, serviceType: string, srcCBName: string}
export function groupInputExtRefElementsByIedNameServiceTypeAndSrcCBName(
	elements: InputExtRefElement[],
): ReceivedMessage[] {
	
	const indexed: { [key: string]: {elements:InputExtRefElement[], key: TempKey} } = {}
	for (const element of elements) {
		if(element.iedName === ""){ continue }

		const key = `${element.iedName}_${element.serviceType}_${element.srcCBName}`
		const tempKey = {iedName: element.iedName, serviceType: element.serviceType, srcCBName: element.srcCBName}
        
		if (!indexed[key]) {
			indexed[key] = {elements: [], key: tempKey}
		}
        
		indexed[key].elements.push(element)
	}
    
	const grouped: ReceivedMessage[] = []
    
	for (const obj of Object.values(indexed)) {
		const {iedName, serviceType, srcCBName} = obj.key
        
		grouped.push({ iedName, serviceType, srcCBName, data: obj.elements })
	}
    
	return grouped
}