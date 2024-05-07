import { IInputs, IOutputs } from "./generated/ManifestTypes";

export class GooglePlacesAutocomplete implements ComponentFramework.StandardControl<IInputs, IOutputs> {

    private _context: ComponentFramework.Context<IInputs>;
    private _container: HTMLDivElement;
    private _inputElement: HTMLInputElement;
    
    private _notifyOutputChanged: () => void;

    private autocomplete: google.maps.places.Autocomplete;
    private street: string;
    private city: string;
    private state: string;
    private zipcode: string;
    private country: string;

    /**
     * Empty constructor.
     */
    constructor()
    {
    }

    /**
     * Used to initialize the control instance. Controls can kick off remote server calls and other initialization actions here.
     * Data-set values are not initialized here, use updateView.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to property names defined in the manifest, as well as utility functions.
     * @param notifyOutputChanged A callback method to alert the framework that the control has new outputs ready to be retrieved asynchronously.
     * @param state A piece of data that persists in one session for a single user. Can be set at any point in a controls life cycle by calling 'setControlState' in the Mode interface.
     * @param container If a control is marked control-type='standard', it will receive an empty div element within which it can render its content.
     */
    public init(context: ComponentFramework.Context<IInputs>, notifyOutputChanged: () => void, state: ComponentFramework.Dictionary, container:HTMLDivElement): void
    {
        this._context = context;
        this._notifyOutputChanged = notifyOutputChanged;
        this._container = container;

        this.street = this._context.parameters.street.raw != null ? this._context.parameters.street.raw : "";
        this.city = this._context.parameters.city.raw != null ? this._context.parameters.city.raw : "";
        this.state = this._context.parameters.state.raw != null ? this._context.parameters.state.raw : "";
        this.zipcode = this._context.parameters.zipcode.raw != null ? this._context.parameters.zipcode.raw : "";
        this.country = this._context.parameters.country.raw != null ? this._context.parameters.country.raw : "";

        this._inputElement = document.createElement("input");
        this._inputElement.setAttribute("id", "addressautocomplete");
        this._inputElement.setAttribute("type", "text");
        this._inputElement.value = this.street;

        this._inputElement.className = "addressAutocomplete";

        this._inputElement.addEventListener("blur", () => {
            if (this.street != this._inputElement.value) {
                this.street = this._inputElement.value;
                this._notifyOutputChanged();
            }
        });

        this._container.appendChild(this._inputElement);

        container = this._container;

        let scriptUrl = "https://maps.googleapis.com/maps/api/js?libraries=places&language=en&key=" + context.parameters.googleapikey.raw;

        let scriptNode = document.createElement('script');
        scriptNode.setAttribute('type', 'text/javascript');
        scriptNode.setAttribute('src', scriptUrl);
        document.head.append(scriptNode);

        window.setTimeout(() => {
            this.autocomplete = new google.maps.places.Autocomplete(this._inputElement, { types: ['geocode'] });

            this.autocomplete.addListener('place_changed', () => {
                let place = this.autocomplete.getPlace();
                
                if (place == null || place.address_components == null) {
                    return
                }

                let streetNumber = "";

                for (let i = 0; i < place.address_components.length; i++) {
                    let addressComponent = place.address_components[i];
                    let componentType = addressComponent.types[0];
                    let addressPiece = addressComponent.long_name;

                    switch (componentType) {
                        case "street_number":
                            streetNumber = addressPiece;
                            break;
                        case "route":
                            this.street = addressPiece + " " + streetNumber;
                            break;
                        case "locality":
                        case "postal_town":
                            this.city = addressPiece;
                            break;
                        case "administrative_area_level_1":
                            this.state = addressPiece;
                            break;
                        case "country":
                            this.country = addressPiece;
                            break;
                        case "postal_code":
                            this.zipcode = addressPiece;
                            break;
                        default:
                            break;
                    }
                }

                this._inputElement.value = this.street;
                this._notifyOutputChanged();
            });
        }, 1000);
    }


    /**
     * Called when any value in the property bag has changed. This includes field values, data-sets, global values such as container height and width, offline status, control metadata values such as label, visible, etc.
     * @param context The entire property bag available to control via Context Object; It contains values as set up by the customizer mapped to names defined in the manifest, as well as utility functions
     */
    public updateView(context: ComponentFramework.Context<IInputs>): void
    {
        // Add code to update control view
    }

    /**
     * It is called by the framework prior to a control receiving new data.
     * @returns an object based on nomenclature defined in manifest, expecting object[s] for property marked as "bound" or "output"
     */
    public getOutputs(): IOutputs
    {
        return {
            street: this.street,
            city: this.city,
            state: this.state,
            country: this.country,
            zipcode: this.zipcode
        };
    }

    /**
     * Called when the control is to be removed from the DOM tree. Controls should use this call for cleanup.
     * i.e. cancelling any pending remote calls, removing listeners, etc.
     */
    public destroy(): void
    {
        // Add code to cleanup control if necessary
    }
}
