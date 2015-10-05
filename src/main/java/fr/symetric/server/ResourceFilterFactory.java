/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package fr.symetric.server;

import com.sun.jersey.api.container.filter.RolesAllowedResourceFilterFactory;
import com.sun.jersey.api.model.AbstractMethod;
import com.sun.jersey.spi.container.ResourceFilter;
import fr.symetric.server.annotations.Audit;
import java.lang.annotation.Annotation;
import java.util.ArrayList;
import java.util.List;
import javax.ws.rs.Path;
import javax.ws.rs.ext.Provider;

/**
 * FilterFactory to create List of request/response filters to be applied on a
 * particular AbstractMethod of a resource.
 *
 * @author "Animesh Kumar <animesh@strumsoft.com>"
 *
 */
@Provider  // register as jersey's provider
public class ResourceFilterFactory extends RolesAllowedResourceFilterFactory {

    private SecurityContextFilter securityContextFilter = new SecurityContextFilter();

    @Override
    public List<ResourceFilter> create(AbstractMethod am) {
        // get filters from RolesAllowedResourceFilterFactory Factory!
        List<ResourceFilter> rolesFilters = super.create(am);
        if (null == rolesFilters) {
            rolesFilters = new ArrayList<ResourceFilter>();
        }

        // Convert into mutable List, so as to add more filters that we need
        // (RolesAllowedResourceFilterFactory generates immutable list of filters)
        List<ResourceFilter> filters = new ArrayList<ResourceFilter>(rolesFilters);

        // Load SecurityContext first (this will load security context onto request)
        filters.add(0, securityContextFilter);

//        // Version Control?
//        filters.add(versionFilter);
        // If this abstract method is annotated with @Audit, we will apply AuditFilter to audit
        // this request.
        if ((am.isAnnotationPresent(Audit.class)) && (am.isAnnotationPresent(Path.class))) {
            filters.add(new AuditingFilter(am.getAnnotation(Path.class).value()));
        }

        return filters;
    }
}
