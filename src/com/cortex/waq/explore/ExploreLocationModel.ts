import MVCEvent from "../../core/mvc/event/MVCEvent";
import AbstractModel from "../../core/mvc/AbstractModel";

import ExploreLocation from "./data/ExploreLocation";

export default class ExploreLocationModel extends AbstractModel {

	private mExploreLocations:Array<ExploreLocation>;

	constructor(aPath:string) {
		super();

		this.mExploreLocations = [];
		this.CreateExploreLocations(aPath);
	}

	private CreateExploreLocations(aPath:string):void {
		this.Fetch("json/waq/" + aPath + ".json");
	}

	public OnJSONLoadSuccess(aJSONData:any, aURL:string):void {
		var json:Array<Object> = aJSONData;
		for (var i:number = 0, iMax:number = json.length; i < iMax; i++) {
			var exploreLocation:ExploreLocation = new ExploreLocation();
			exploreLocation.FromJSON(json[i]);
			this.mExploreLocations.push(exploreLocation);
		}

		super.OnJSONLoadSuccess(aJSONData, aURL);
		this.DispatchEvent(new MVCEvent(MVCEvent.JSON_LOADED));
	}

	public GetExploreLocations():Array<ExploreLocation> {
		return this.mExploreLocations;
	}

}
