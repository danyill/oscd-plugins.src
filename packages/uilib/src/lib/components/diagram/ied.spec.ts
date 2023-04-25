import { render, fireEvent, screen } from "@testing-library/svelte";
import {describe, it, expect} from "vitest";

import IED from "./ied.svelte"
import type { IEDNode } from "./nodes";



describe("IED", () => {
	it("renders", () => {

		const label = "IED1"
	
		const node: IEDNode = {
			id: label,
			label: label,
			isRelevant: true,
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			edges: [],
		}


		render(IED, { node })
		const stuff = screen.getByText(label)
		expect(stuff).toBeTruthy()
	})

	it("applies 'isIrrelevant' class if the node's 'relevant' prop is false", () => {
		
		const label = "IED1"
	
		const node: IEDNode = {
			id: label,
			label: label,
			isRelevant: false,
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			edges: [],
		}

		render(IED, { node })
		const stuff = screen.getByText(label)
		expect(stuff.classList.contains("isIrrelevant")).toBeTruthy()

	})

	it("applies 'focus' if the 'isSelected' prop is true", () => {
		
		const label = "IED1"
	
		const node: IEDNode = {
			id: label,
			label: label,
			isRelevant: true,
			x: 0,
			y: 0,
			width: 100,
			height: 100,
			edges: [],
		}

		render(IED, { node, isSelected: true })
		const stuff = screen.getByText(label)
		expect(stuff.classList.contains("focus")).toBeTruthy()


	})
})
