import { useEffect, useState } from "react";

let countriesRequest;
let vietnamProvincesRequest;
const localityRequests = new Map();

async function getCountries() {
  if (!countriesRequest) {
    countriesRequest = fetch(
      "https://countriesnow.space/api/v0.1/countries/states",
    )
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được danh sách quốc gia.");
        const result = await response.json();
        if (result.error || !Array.isArray(result.data)) {
          throw new Error(result.msg || "Danh sách quốc gia không hợp lệ.");
        }
        return result.data;
      })
      .catch((error) => {
        countriesRequest = undefined;
        throw error;
      });
  }
  return countriesRequest;
}

async function getVietnamProvinces() {
  if (!vietnamProvincesRequest) {
    vietnamProvincesRequest = fetch("https://provinces.open-api.vn/api/v2/")
      .then(async (response) => {
        if (!response.ok) throw new Error("Không tải được danh sách tỉnh/thành.");
        const result = await response.json();
        if (!Array.isArray(result)) {
          throw new Error("Danh sách tỉnh/thành không hợp lệ.");
        }
        return result.map(({ code, name }) => ({ code, name }));
      })
      .catch((error) => {
        vietnamProvincesRequest = undefined;
        throw error;
      });
  }
  return vietnamProvincesRequest;
}

function getLocalities(country, province) {
  const key = `${country.iso2}:${province.code || province.name}`;
  if (!localityRequests.has(key)) {
    const request =
      country.iso2 === "VN"
        ? fetch(
            `https://provinces.open-api.vn/api/v2/p/${province.code}?depth=2`,
          ).then(async (response) => {
            if (!response.ok) throw new Error("Không tải được danh sách phường/xã.");
            const result = await response.json();
            if (!Array.isArray(result.wards)) {
              throw new Error("Danh sách phường/xã không hợp lệ.");
            }
            return result.wards.map((ward) => ward.name);
          })
        : fetch(
            "https://countriesnow.space/api/v0.1/countries/state/cities",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                country: country.name,
                state: province.name,
              }),
            },
          ).then(async (response) => {
            if (!response.ok) throw new Error("Không tải được danh sách địa phương.");
            const result = await response.json();
            if (result.error || !Array.isArray(result.data)) {
              throw new Error(result.msg || "Danh sách địa phương không hợp lệ.");
            }
            return result.data;
          });
    localityRequests.set(key, request.catch((error) => {
      localityRequests.delete(key);
      throw error;
    }));
  }
  return localityRequests.get(key);
}

export default function LocationFields({ value, onChange }) {
  const [countries, setCountries] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [localities, setLocalities] = useState([]);
  const [loadingCountries, setLoadingCountries] = useState(true);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingLocalities, setLoadingLocalities] = useState(false);
  const [error, setError] = useState("");

  const country = countries.find((item) => item.name === value.hometownCountry);
  const province = provinces.find(
    (item) => item.name === value.hometownProvince,
  );

  useEffect(() => {
    let active = true;
    getCountries()
      .then((rows) => {
        if (active) setCountries(rows);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoadingCountries(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setProvinces([]);
    setLocalities([]);
    setError("");
    if (!country) return undefined;

    setLoadingProvinces(true);
    setError("");
    const loadProvinces =
      country.iso2 === "VN"
        ? getVietnamProvinces()
        : Promise.resolve(
            (country.states || []).map((state) => ({
              code: state.state_code || state.name,
              name: state.name,
            })),
          );
    loadProvinces
      .then((rows) => {
        if (active) setProvinces(rows);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoadingProvinces(false);
      });
    return () => {
      active = false;
    };
  }, [country]);

  useEffect(() => {
    let active = true;
    setLocalities([]);
    setError("");
    if (!country || !province) return undefined;

    setLoadingLocalities(true);
    setError("");
    getLocalities(country, province)
      .then((rows) => {
        if (active) setLocalities(rows);
      })
      .catch((loadError) => {
        if (active) setError(loadError.message);
      })
      .finally(() => {
        if (active) setLoadingLocalities(false);
      });
    return () => {
      active = false;
    };
  }, [country, province]);

  function updateLocation(key, nextValue) {
    onChange({
      ...value,
      [key]: nextValue,
      ...(key === "hometownCountry"
        ? { hometownProvince: "", hometownCity: "" }
        : {}),
      ...(key === "hometownProvince" ? { hometownCity: "" } : {}),
    });
  }

  return (
    <>
      <label className="manager-field">
        <span>Quốc gia nơi sinh</span>
        <select
          value={value.hometownCountry}
          onChange={(event) =>
            updateLocation("hometownCountry", event.target.value)
          }
          disabled={loadingCountries}
        >
          <option value="">
            {loadingCountries ? "Đang tải quốc gia..." : "Chọn quốc gia"}
          </option>
          {countries.map((item) => (
            <option key={item.iso2} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="manager-field">
        <span>{country?.iso2 === "VN" ? "Tỉnh / thành phố" : "Tỉnh / bang"}</span>
        <select
          value={value.hometownProvince}
          onChange={(event) =>
            updateLocation("hometownProvince", event.target.value)
          }
          disabled={!country || loadingProvinces}
        >
          <option value="">
            {loadingProvinces ? "Đang tải tỉnh/thành..." : "Chọn tỉnh / bang"}
          </option>
          {provinces.map((item) => (
            <option key={item.code} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="manager-field">
        <span>
          {country?.iso2 === "VN" ? "Phường / xã" : "Thành phố / địa phương"}
        </span>
        <select
          value={value.hometownCity}
          onChange={(event) =>
            updateLocation("hometownCity", event.target.value)
          }
          disabled={!province || loadingLocalities}
        >
          <option value="">
            {loadingLocalities ? "Đang tải..." : "Chọn phường / địa phương"}
          </option>
          {localities.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </label>
      {error && (
        <small className="manager-form-error manager-field--full" role="alert">
          {error}
        </small>
      )}
      <label className="manager-field manager-field--full">
        <span>Địa chỉ nhà</span>
        <input
          value={value.hometownAddress}
          onChange={(event) =>
            onChange({ ...value, hometownAddress: event.target.value })
          }
          placeholder="Số nhà, tên đường..."
        />
      </label>
    </>
  );
}
