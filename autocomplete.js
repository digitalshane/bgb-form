// autocomplete.js

export const initPlacesAutocomplete = (formState) => {
  // Create script element for Google Maps
  const script = document.createElement("script");
  script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyDYtBXgwSqrzOkcl0YqvvdMppImXuTIf2U&libraries=places`;

  script.onload = () => {
    // Get the address input element
    const addressInput = document.querySelector('[data-input="address"]');

    if (!addressInput) {
      console.error("Address input not found");
      return;
    }

    const autocomplete = new google.maps.places.Autocomplete(addressInput, {
      componentRestrictions: { country: "US" },
      fields: ["address_components", "formatted_address"],
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();

      if (!place.formatted_address) {
        console.error("No address details available");
        return;
      }

      // Update the form state with the selected address
      formState.address = place.formatted_address;

      // Extract and set other address components
      place.address_components.forEach((component) => {
        const type = component.types[0];

        switch (type) {
          case "locality":
            formState.city = component.long_name;
            break;
          case "administrative_area_level_1":
            formState.state = component.short_name;
            break;
          case "postal_code":
            formState.zip = component.long_name;
            break;
        }
      });
    });
  };

  // Add script to document
  document.head.appendChild(script);
};
