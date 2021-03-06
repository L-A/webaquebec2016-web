/*
 * All information contained herein is, and remains
 * the property of Cortex Media and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Cortex Media and its suppliers
 * and may be covered by Canada and Foreign Patents,
 * and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Cortex Media.
 *
 * @copyright    Cortex Media 2014
 *
 * @author Mathieu 'Sanchez' Cote
 */
export default class ComponentData {
	
	private mID:string;
	private mData:any;
	
	public get ID():string { return this.mID; }
	public set ID(aValue:string) { this.mID = aValue; }
	
	public FromJSON(aData:any):void{
		
		this.mData = aData;
	}
	
	public ToJSON():any{
		
		return(this.mData);
	}
}